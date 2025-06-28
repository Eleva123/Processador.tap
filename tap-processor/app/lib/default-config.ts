import { ProjectConfig } from './types';

export const DEFAULT_CONFIG: ProjectConfig = {
  header: `; Projeto: {FILENAME}
; Data: {DATE}
; Tipo de EPS: {MATERIAL}
; Feed Rate: {FEED_RATE} mm/min

; === INICIO DO CORTE ===
G90             ; Modo absoluto
G92 X0 Y0       ; Zera a origem
F{FEED_RATE}    ; Velocidade base`,

  footer: `

; === FINALIZACAO ===
; Fim do programa

; === ESTATISTICAS ===
; Total de pontos G01 validos: {TOTAL_COMMANDS}
; Distancia total: {TOTAL_DISTANCE} mm
; Tempo de corte: {ESTIMATED_TIME}
; Tempo de pausas: {PAUSE_SECONDS} segundos



; G-CODE gerado por:
; Danilo Pellens / ELEVA DIGITAL MIDIA / WhatsApp: (41)99921-7821
;
;FIM`
};

export const FACTORY_CONFIG: ProjectConfig = {
  header: `; Projeto: {FILENAME}
; Data: {DATE}
; Tipo de EPS: T1
; Feed Rate: 600 mm/min

; === INICIO DO CORTE ===
G90             ; Modo absoluto
G92 X0 Y0       ; Zera a origem
F600            ; Velocidade base`,

  footer: `

; === FINALIZACAO ===
; Fim do programa

; === ESTATISTICAS ===
; Total de pontos G01 validos: {TOTAL_COMMANDS}
; Distancia total: {TOTAL_DISTANCE} mm
; Tempo estimado: {ESTIMATED_TIME}
; Tempo de pausas: {PAUSE_SECONDS} segundos

; G-CODE gerado por:
; Danilo Pellens / ELEVA DIGITAL MIDIA / WhatsApp: (41)99921-7821
;
;FIM`
};
