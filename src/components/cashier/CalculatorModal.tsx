import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CalculatorModalProps {
  showCalculator: boolean;
  setShowCalculator: (show: boolean) => void;
  calculatorInput: string;
  handleCalculatorInput: (value: string) => void;
}

const CalculatorModal: React.FC<CalculatorModalProps> = ({
  showCalculator,
  setShowCalculator,
  calculatorInput,
  handleCalculatorInput
}) => {
  if (!showCalculator) return null;

  return (
    <View style={styles.calculatorOverlay}>
      <View style={styles.calculatorContainer}>
        <View style={styles.calculatorHeader}>
          <Text style={styles.calculatorTitle}>Calculator</Text>
          <TouchableOpacity 
            style={styles.calculatorCloseButton}
            onPress={() => setShowCalculator(false)}
          >
            <Text style={styles.calculatorCloseText}>×</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.calculatorDisplay}>{calculatorInput || '0'}</Text>
        <View style={styles.calculatorButtons}>
          <View style={styles.calculatorRow}>
            <TouchableOpacity style={[styles.calculatorButton, styles.clearButton]} onPress={() => handleCalculatorInput('C')}>
              <Text style={styles.calculatorButtonText}>C</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.calculatorButton, styles.clearButton]} onPress={() => handleCalculatorInput('←')}>
              <Text style={styles.calculatorButtonText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.calculatorButton, styles.operatorButton]} onPress={() => handleCalculatorInput('÷')}>
              <Text style={styles.calculatorButtonText}>÷</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calculatorRow}>
            <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('7')}>
              <Text style={styles.calculatorButtonText}>7</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('8')}>
              <Text style={styles.calculatorButtonText}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('9')}>
              <Text style={styles.calculatorButtonText}>9</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.calculatorButton, styles.operatorButton]} onPress={() => handleCalculatorInput('×')}>
              <Text style={styles.calculatorButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calculatorRow}>
            <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('4')}>
              <Text style={styles.calculatorButtonText}>4</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('5')}>
              <Text style={styles.calculatorButtonText}>5</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('6')}>
              <Text style={styles.calculatorButtonText}>6</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.calculatorButton, styles.operatorButton]} onPress={() => handleCalculatorInput('-')}>
              <Text style={styles.calculatorButtonText}>-</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calculatorRow}>
            <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('1')}>
              <Text style={styles.calculatorButtonText}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('2')}>
              <Text style={styles.calculatorButtonText}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('3')}>
              <Text style={styles.calculatorButtonText}>3</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.calculatorButton, styles.operatorButton]} onPress={() => handleCalculatorInput('+')}>
              <Text style={styles.calculatorButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calculatorRow}>
            <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('0')}>
              <Text style={styles.calculatorButtonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('.')} >
              <Text style={styles.calculatorButtonText}>.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.calculatorButton, styles.equalsButton]} onPress={() => handleCalculatorInput('=')}>
              <Text style={styles.calculatorButtonText}>=</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calculatorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatorContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '70%',
  },
  calculatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  calculatorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calculatorCloseButton: {
    padding: 5,
  },
  calculatorCloseText: {
    fontSize: 24,
    color: '#666',
  },
  calculatorDisplay: {
    fontSize: 24,
    textAlign: 'right',
    padding: 15,
    backgroundColor: '#f5f5f5',
    fontFamily: 'monospace',
    minHeight: 40,
  },
  calculatorButtons: {
    padding: 10,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calculatorButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  operatorButton: {
    backgroundColor: '#ff9500',
    marginHorizontal: 5,
  },
  equalsButton: {
    backgroundColor: '#ff9500',
    flex: 2,
    marginHorizontal: 5,
  },
  clearButton: {
    backgroundColor: '#a6a6a6',
    flex: 1,
    marginHorizontal: 5,
  },
  calculatorButtonText: {
    fontSize: 18,
    color: '#333',
  },
});

export default CalculatorModal;