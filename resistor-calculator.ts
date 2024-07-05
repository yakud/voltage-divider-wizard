// resistor-calculator.ts

interface ResistorType {
  value: number;
  name: string;
}

class Resistor implements ResistorType {
  constructor(public value: number, public name: string = "") {}

  getTotalResistance(): number {
    return this.value;
  }

  toString(): string {
    return `Resistor(${this.value} Ω${this.name ? ', ' + this.name : ''})`;
  }

  toMermaid(): string {
    return `${this.name}[${this.name}: ${this.value} Ω]`;
  }
}

class ResistorNetwork {
  name: string;

  constructor(public components: (ResistorNetwork | Resistor)[], public isParallel: boolean = false) {
    this.name = `N${Math.floor(Math.random() * 1000)}`;
  }

  getTotalResistance(): number {
    if (this.isParallel) {
      return 1 / this.components.reduce((sum, comp) => sum + 1 / comp.getTotalResistance(), 0);
    } else {
      return this.components.reduce((sum, comp) => sum + comp.getTotalResistance(), 0);
    }
  }

  toString(): string {
    const connectionType = this.isParallel ? "parallel" : "series";
    const componentsStr = this.components.map(comp => comp.toString()).join(", ");
    return `${connectionType}(${componentsStr})`;
  }

  toMermaid(isRoot: boolean = false, startNode: string = "VCC", endNode: string = "GND"): string {
    const lines: string[] = ["graph LR"];
    if (isRoot) {
      lines.push(`    ${startNode}((${startNode}))`);
    }

    if (this.isParallel) {
      this.parallelToMermaid(lines, isRoot, startNode, endNode);
    } else {
      this.seriesToMermaid(lines, isRoot, startNode, endNode);
    }

    if (isRoot) {
      lines.push(`    ${endNode}((${endNode}))`);
    }
    return lines.join("\n");
  }

  private seriesToMermaid(lines: string[], isRoot: boolean, startNode: string, endNode: string): void {
    let prevNode = startNode;
    this.components.forEach((component, i) => {
      if (component instanceof ResistorNetwork) {
        const nextNode = i === this.components.length - 1 ? endNode : `${this.name}_N${i}`;
        component.toMermaidHelper(lines, prevNode, nextNode);
      } else {
        lines.push(`    ${prevNode} --- ${component.toMermaid()}`);
        if (i === this.components.length - 1) {
          lines.push(`    ${component.name} --- ${endNode}`);
        }
      }
      prevNode = component instanceof Resistor ? component.name : `${this.name}_N${i}`;
    });
  }

  private parallelToMermaid(lines: string[], isRoot: boolean, startNode: string, endNode: string): void {
    this.components.forEach(component => {
      if (component instanceof ResistorNetwork) {
        component.toMermaidHelper(lines, startNode, endNode);
      } else {
        lines.push(`    ${startNode} --- ${component.toMermaid()} --- ${endNode}`);
      }
    });
  }

  private toMermaidHelper(lines: string[], startNode: string, endNode: string): void {
    if (this.isParallel) {
      this.parallelToMermaid(lines, false, startNode, endNode);
    } else {
      this.seriesToMermaid(lines, false, startNode, endNode);
    }
  }
}

function combinationsWithReplacement<T>(arr: T[], n: number): T[][] {
  if (n === 0) return [[]];
  const result: T[][] = [];

  function backtrack(start: number, current: T[]): void {
    if (current.length === n) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
}

function generateCombinations(resistors: number[], maxCount: number): number[][] {
  const combinations: number[][] = [];
  for (let i = 1; i <= maxCount; i++) {
    combinations.push(...combinationsWithReplacement(resistors, i));
  }
  return combinations;
}


function generateAllResistorCombinations(resistors: ResistorType[], maxCount: number): ResistorNetwork[] {
  const resistorValues = resistors.map(r => r.value);
  const combinations = generateCombinations(resistorValues, maxCount);
  const allCombinations: ResistorNetwork[] = [];

  for (const combo of combinations) {
    // Add series connection
    allCombinations.push(new ResistorNetwork(combo.map(r => new Resistor(r, `R${r}`)), false));

    // Add parallel connection
    if (combo.length > 1) {
      allCombinations.push(new ResistorNetwork(combo.map(r => new Resistor(r, `R${r}`)), true));
    }
  }

  return allCombinations;
}

function findBestVoltageDivider(inputVoltage: number, outputVoltage: number, maxResistorsCount: number, resistors: ResistorType[]): { gndNetwork: ResistorNetwork; vccNetwork: ResistorNetwork } {
  const allResistances = generateAllResistorCombinations(resistors, maxResistorsCount);
  let bestCombination: [ResistorNetwork, ResistorNetwork] | null = null;
  let bestError = Infinity;

  for (const r1Network of allResistances) {
    for (const r2Network of allResistances) {
      const r1 = r1Network.getTotalResistance();
      const r2 = r2Network.getTotalResistance();
      const calculatedVoltage = inputVoltage * r2 / (r1 + r2);
      const error = Math.abs(calculatedVoltage - outputVoltage);

      if (error < bestError) {
        bestError = error;
        bestCombination = [r1Network, r2Network];
      }
    }
  }

  if (bestCombination === null) {
    return { gndNetwork: new ResistorNetwork([]), vccNetwork: new ResistorNetwork([]) };
  }

  return {
    gndNetwork: bestCombination[0],
    vccNetwork: bestCombination[1]
  };
}

export function calculateVoltageDivider(
  inputVoltage: number,
  outputVoltage: number,
  maxResistorsCount: number,
  resistors: ResistorType[]
): { gndNetwork: string; vccNetwork: string; actualVoltage: number; error: number } {
  console.log("Resistor Calculator, resistors: ", resistors)

  const result = findBestVoltageDivider(inputVoltage, outputVoltage, maxResistorsCount, resistors);

  const r1 = result.gndNetwork.getTotalResistance();
  const r2 = result.vccNetwork.getTotalResistance();
  const actualOutputVoltage = inputVoltage * r2 / (r1 + r2);
  const error = Math.abs(actualOutputVoltage - outputVoltage);

  let R = 1;
  for (const resistor of result.gndNetwork.components) {
    if (resistor instanceof Resistor) {
      resistor.name = `R${R}`;
      R++;
    }
  }
  for (const resistor of result.vccNetwork.components) {
    if (resistor instanceof Resistor) {
      resistor.name = `R${R}`;
      R++;
    }
  }

  return {
    gndNetwork: result.gndNetwork.toMermaid(true, "GND", "DIV"),
    vccNetwork: result.vccNetwork.toMermaid(true, "VCC", "DIV"),
    actualVoltage: actualOutputVoltage,
    error: error
  };
}