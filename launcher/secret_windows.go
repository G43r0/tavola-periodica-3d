//go:build windows

package main

import (
	"errors"
	"syscall"
	"unsafe"
)

// Il token è cifrato con DPAPI: solo lo stesso utente Windows, su questo PC, può rileggerlo.
const secretScheme = "dpapi"

var (
	crypt32            = syscall.NewLazyDLL("crypt32.dll")
	kernel32           = syscall.NewLazyDLL("kernel32.dll")
	procProtectData    = crypt32.NewProc("CryptProtectData")
	procUnprotectData  = crypt32.NewProc("CryptUnprotectData")
	procLocalFree      = kernel32.NewProc("LocalFree")
	procGetConsoleMode = kernel32.NewProc("GetConsoleMode")
	procSetConsoleMode = kernel32.NewProc("SetConsoleMode")
)

type dataBlob struct {
	size uint32
	data *byte
}

func blobOf(b []byte) *dataBlob {
	if len(b) == 0 {
		return &dataBlob{}
	}
	return &dataBlob{size: uint32(len(b)), data: &b[0]}
}

func dpapi(proc *syscall.LazyProc, in []byte) ([]byte, error) {
	var out dataBlob
	const uiForbidden = 0x1
	r, _, err := proc.Call(uintptr(unsafe.Pointer(blobOf(in))), 0, 0, 0, 0, uiForbidden, uintptr(unsafe.Pointer(&out)))
	if r == 0 {
		return nil, errors.New("DPAPI: " + err.Error())
	}
	defer procLocalFree.Call(uintptr(unsafe.Pointer(out.data)))
	res := make([]byte, out.size)
	copy(res, unsafe.Slice(out.data, out.size))
	return res, nil
}

func protectSecret(b []byte) ([]byte, error)   { return dpapi(procProtectData, b) }
func unprotectSecret(b []byte) ([]byte, error) { return dpapi(procUnprotectData, b) }

// readSecretLine legge una riga senza mostrarla a schermo.
func readSecretLine(read func() (string, error)) (string, error) {
	var mode uint32
	h, _ := syscall.GetStdHandle(syscall.STD_INPUT_HANDLE)
	if r, _, _ := procGetConsoleMode.Call(uintptr(h), uintptr(unsafe.Pointer(&mode))); r != 0 {
		const echoInput = 0x4
		procSetConsoleMode.Call(uintptr(h), uintptr(mode&^echoInput))
		defer procSetConsoleMode.Call(uintptr(h), uintptr(mode))
	}
	return read()
}
