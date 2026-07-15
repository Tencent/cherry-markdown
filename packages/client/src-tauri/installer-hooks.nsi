; ============================================================================
; Cherry Markdown - NSIS installer hooks
; Registers the built-in Windows Text Preview Handler for .md / .markdown
; so that Explorer's preview pane shows the raw markdown source (same as .txt).
; ============================================================================

; IPreviewHandler interface IID (fixed for all extensions)
!define PREVIEW_HANDLER_IID "{8895b1c6-b41f-4c1c-a562-0d564250836f}"

; System-built-in Text Preview Handler CLSID
!define TEXT_PREVIEW_HANDLER_CLSID "{1531d583-8375-4d3f-b5fb-d23bbd169f22}"

; ----------------------------------------------------------------------------
; Helper: write preview-handler association under the given root key ($0)
; $0 must be set to "HKLM" or "HKCU" before invoking.
; ----------------------------------------------------------------------------
!macro CherryRegisterPreviewHandlerFor EXT
  ${If} $0 == "HKLM"
    WriteRegStr HKLM "Software\Classes\${EXT}\ShellEx\${PREVIEW_HANDLER_IID}" "" "${TEXT_PREVIEW_HANDLER_CLSID}"
  ${Else}
    WriteRegStr HKCU "Software\Classes\${EXT}\ShellEx\${PREVIEW_HANDLER_IID}" "" "${TEXT_PREVIEW_HANDLER_CLSID}"
  ${EndIf}
!macroend

!macro CherryUnregisterPreviewHandlerFor EXT
  DeleteRegKey HKLM "Software\Classes\${EXT}\ShellEx\${PREVIEW_HANDLER_IID}"
  DeleteRegKey HKCU "Software\Classes\${EXT}\ShellEx\${PREVIEW_HANDLER_IID}"
!macroend

; ----------------------------------------------------------------------------
; Post-install hook: called after files are installed
; ----------------------------------------------------------------------------
!macro NSIS_HOOK_POSTINSTALL
  ; Decide the target hive based on the install mode selected by the user.
  ; Tauri's NSIS template exposes $MultiUser.InstallMode ("AllUsers" / "CurrentUser").
  StrCpy $0 "HKCU"
  ${If} $MultiUser.InstallMode == "AllUsers"
    StrCpy $0 "HKLM"
  ${EndIf}

  !insertmacro CherryRegisterPreviewHandlerFor ".md"
  !insertmacro CherryRegisterPreviewHandlerFor ".markdown"

  ; Notify Explorer so the preview-pane association takes effect immediately.
  ; SHCNE_ASSOCCHANGED = 0x08000000, SHCNF_IDLIST = 0
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

; ----------------------------------------------------------------------------
; Post-uninstall hook: called after files are removed
; ----------------------------------------------------------------------------
!macro NSIS_HOOK_POSTUNINSTALL
  ; Simple cleanup: remove from both hives to cover any install mode.
  !insertmacro CherryUnregisterPreviewHandlerFor ".md"
  !insertmacro CherryUnregisterPreviewHandlerFor ".markdown"

  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
