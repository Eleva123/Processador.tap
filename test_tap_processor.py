#!/usr/bin/env python3
"""
Script para testar o algoritmo de processamento TAP
Valida se as pausas G04 estão sendo inseridas corretamente
"""

import re
import math

def calculate_distance(x1, y1, x2, y2):
    """Calcula distância máxima usando D = max(|ΔX|, |ΔY|)"""
    delta_x = abs(x2 - x1)
    delta_y = abs(y2 - y1)
    return max(delta_x, delta_y)

def parse_coordinates(line):
    """Extrai coordenadas X e Y de uma linha G01"""
    x_match = re.search(r'X([-+]?\d*\.?\d+)', line)
    y_match = re.search(r'Y([-+]?\d*\.?\d+)', line)
    
    x = float(x_match.group(1)) if x_match else None
    y = float(y_match.group(1)) if y_match else None
    
    return x, y

def test_tap_algorithm(input_file):
    """Testa o algoritmo TAP e valida as regras"""
    print(f"=== TESTANDO ALGORITMO TAP ===")
    print(f"Arquivo: {input_file}")
    print()
    
    with open(input_file, 'r') as f:
        lines = f.readlines()
    
    current_x, current_y = 0, 0
    accumulator = 0
    total_distance = 0
    pause_counts = {'P0.0': 0, 'P0.3': 0, 'P0.5': 0}
    processed_lines = []
    
    print("PROCESSAMENTO LINHA POR LINHA:")
    print("-" * 60)
    
    for i, line in enumerate(lines, 1):
        line = line.strip()
        processed_lines.append(line)
        
        if line.startswith('G01') and ('X' in line or 'Y' in line):
            x, y = parse_coordinates(line)
            
            # Usar coordenadas anteriores se não especificadas
            if x is None:
                x = current_x
            if y is None:
                y = current_y
            
            # Calcular distância
            distance = calculate_distance(current_x, current_y, x, y)
            total_distance += distance
            accumulator += distance
            
            print(f"Linha {i:2d}: {line}")
            print(f"         De ({current_x}, {current_y}) para ({x}, {y})")
            print(f"         Distância: {distance:.1f}mm, Acumulador: {accumulator:.1f}mm")
            
            # Aplicar regras de pausa
            if distance <= 5:
                # D ≤ 5mm: G04 P0.0 (mantém acumulador)
                pause_line = "G04 P0.0"
                pause_counts['P0.0'] += 1
                print(f"         → Inserindo: {pause_line} (mantém acumulador)")
            elif 5 < distance <= 50:
                # 5 < D ≤ 50mm: G04 P0.3 (zera acumulador)
                pause_line = "G04 P0.3"
                pause_counts['P0.3'] += 1
                accumulator = 0
                print(f"         → Inserindo: {pause_line} (zera acumulador)")
            else:
                # D > 50mm: G04 P0.5 (zera acumulador)
                pause_line = "G04 P0.5"
                pause_counts['P0.5'] += 1
                accumulator = 0
                print(f"         → Inserindo: {pause_line} (zera acumulador)")
            
            processed_lines.append(pause_line)
            
            # Atualizar posição atual
            current_x, current_y = x, y
            print()
    
    print("=== ESTATÍSTICAS FINAIS ===")
    print(f"Distância total: {total_distance:.1f}mm")
    print(f"Pausas P0.0 (curtas): {pause_counts['P0.0']}")
    print(f"Pausas P0.3 (médias): {pause_counts['P0.3']}")
    print(f"Pausas P0.5 (longas): {pause_counts['P0.5']}")
    print(f"Total de pausas: {sum(pause_counts.values())}")
    
    # Calcular tempo estimado (exemplo: 0.1s por pausa P0.0, 0.3s por P0.3, 0.5s por P0.5)
    estimated_time = (pause_counts['P0.0'] * 0.0 + 
                     pause_counts['P0.3'] * 0.3 + 
                     pause_counts['P0.5'] * 0.5)
    print(f"Tempo estimado de pausas: {estimated_time:.1f}s")
    
    # Salvar arquivo processado
    output_file = input_file.replace('.tap', '_processed.tap')
    with open(output_file, 'w') as f:
        f.write('\n'.join(processed_lines))
    
    print(f"\nArquivo processado salvo: {output_file}")
    
    return {
        'total_distance': total_distance,
        'pause_counts': pause_counts,
        'estimated_time': estimated_time,
        'processed_file': output_file
    }

if __name__ == "__main__":
    # Testar com o arquivo sample.tap
    input_file = "/home/ubuntu/tap-processor/app/public/sample.tap"
    results = test_tap_algorithm(input_file)
