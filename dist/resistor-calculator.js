// resistor-calculator.ts
class Resistor {
    constructor(value, name = "") {
        this.value = value;
        this.name = name;
    }
    getTotalResistance() {
        return this.value;
    }
    toString() {
        return `Resistor(${this.value} Ω${this.name ? ', ' + this.name : ''})`;
    }
    toMermaid() {
        return `${this.name}[${this.name}: ${this.value} Ω]`;
    }
}
class ResistorNetwork {
    constructor(components, isParallel = false) {
        this.components = components;
        this.isParallel = isParallel;
        this.name = `N${Math.floor(Math.random() * 1000)}`;
    }
    getTotalResistance() {
        if (this.isParallel) {
            return 1 / this.components.reduce((sum, comp) => sum + 1 / comp.getTotalResistance(), 0);
        }
        else {
            return this.components.reduce((sum, comp) => sum + comp.getTotalResistance(), 0);
        }
    }
    toString() {
        const connectionType = this.isParallel ? "parallel" : "series";
        const componentsStr = this.components.map(comp => comp.toString()).join(", ");
        return `${connectionType}(${componentsStr})`;
    }
    toMermaid(isRoot = false, startNode = "VCC", endNode = "GND") {
        const lines = ["graph LR"];
        if (isRoot) {
            lines.push(`    ${startNode}((${startNode}))`);
        }
        if (this.isParallel) {
            this.parallelToMermaid(lines, isRoot, startNode, endNode);
        }
        else {
            this.seriesToMermaid(lines, isRoot, startNode, endNode);
        }
        if (isRoot) {
            lines.push(`    ${endNode}((${endNode}))`);
        }
        return lines.join("\n");
    }
    seriesToMermaid(lines, isRoot, startNode, endNode) {
        let prevNode = startNode;
        this.components.forEach((component, i) => {
            if (component instanceof ResistorNetwork) {
                const nextNode = i === this.components.length - 1 ? endNode : `${this.name}_N${i}`;
                component.toMermaidHelper(lines, prevNode, nextNode);
            }
            else {
                lines.push(`    ${prevNode} --- ${component.toMermaid()}`);
                if (i === this.components.length - 1) {
                    lines.push(`    ${component.name} --- ${endNode}`);
                }
            }
            prevNode = component instanceof Resistor ? component.name : `${this.name}_N${i}`;
        });
    }
    parallelToMermaid(lines, isRoot, startNode, endNode) {
        this.components.forEach(component => {
            if (component instanceof ResistorNetwork) {
                component.toMermaidHelper(lines, startNode, endNode);
            }
            else {
                lines.push(`    ${startNode} --- ${component.toMermaid()} --- ${endNode}`);
            }
        });
    }
    toMermaidHelper(lines, startNode, endNode) {
        if (this.isParallel) {
            this.parallelToMermaid(lines, false, startNode, endNode);
        }
        else {
            this.seriesToMermaid(lines, false, startNode, endNode);
        }
    }
}
function combinationsWithReplacement(arr, n) {
    if (n === 0)
        return [[]];
    const result = [];
    function backtrack(start, current) {
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
function generateCombinations(resistors, maxCount) {
    const combinations = [];
    for (let i = 1; i <= maxCount; i++) {
        combinations.push(...combinationsWithReplacement(resistors, i));
    }
    return combinations;
}
function generateAllResistorCombinations(resistors, maxCount) {
    const resistorValues = resistors.map(r => r.value);
    const combinations = generateCombinations(resistorValues, maxCount);
    const allCombinations = [];
    for (const combo of combinations) {
        // Добавляем последовательное соединение
        allCombinations.push(new ResistorNetwork(combo.map(r => new Resistor(r, `R${r}`)), false));
        // Добавляем параллельное соединение, если больше одного резистора
        if (combo.length > 1) {
            allCombinations.push(new ResistorNetwork(combo.map(r => new Resistor(r, `R${r}`)), true));
        }
    }
    return allCombinations;
}
function findBestVoltageDivider(inputVoltage, outputVoltage, maxResistorsCount, resistors) {
    const allResistances = generateAllResistorCombinations(resistors, maxResistorsCount);
    let bestCombination = null;
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
// Пример использования
const resistorsInOhms = [
    { value: 240, name: "240Ω" },
    { value: 470, name: "470Ω" },
    { value: 510, name: "510Ω" },
    { value: 1200, name: "1.2kΩ" },
    { value: 100000, name: "100kΩ" },
    { value: 10000, name: "10kΩ" },
    { value: 1000, name: "1kΩ" },
    { value: 2200, name: "2.2kΩ" },
    { value: 200000, name: "200kΩ" },
    { value: 20000, name: "20kΩ" },
    { value: 220000, name: "220kΩ" },
    { value: 22000, name: "22kΩ" },
    { value: 27000, name: "27kΩ" },
    { value: 30000, name: "30kΩ" },
    { value: 3000, name: "3kΩ" },
    { value: 4700, name: "4.7kΩ" },
    { value: 470000, name: "470kΩ" },
    { value: 47000, name: "47kΩ" },
    { value: 510000, name: "510kΩ" },
    { value: 71000, name: "71kΩ" },
    { value: 97000, name: "97kΩ" },
];
export function calculateVoltageDivider(inputVoltage, outputVoltage, maxResistorsCount) {
    const result = findBestVoltageDivider(inputVoltage, outputVoltage, maxResistorsCount, resistorsInOhms);
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
