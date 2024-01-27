import { parseArgs } from "util";

interface Point {
    x: number;
    y: number;
}

interface Load {
    loadNumber: number;
    pickup: Point;
    dropoff: Point;
    distance: number;
}

/**
 * Parses a Point from a string in format "(x,y)"
 */
const pointFromString = (str: string): Point => {
    const vals = str.slice(1, str.length - 1).split(",").map(val => Number.parseFloat(val));
    return {
        x: vals[0],
        y: vals[1],
    };
}

/**
 * Parses the contents of the test file's line into a PointPair
 * @param line A string in format "loadNumber (x1,y1) (x2, y2)"
 * e.g. "1 (-9.100071078494038,-48.89301103772511) (-116.78442279683607,76.80147820713637)"
 */
const loadFromFileLine = (line: string): Load => {
    const [loadNumber, start, end] = line.split(" ");
    const pickup = pointFromString(start);
    const dropoff = pointFromString(end);
    return {
        loadNumber: Number.parseInt(loadNumber),
        pickup: pickup,
        dropoff: dropoff,
        distance: distanceBetweenPoints(pickup, dropoff),
    };
}

/**
 * Calculates euclidean distance between two points
 */
const distanceBetweenPoints = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}



const { positionals } = parseArgs({
    allowPositionals: true,
})
const path = positionals.pop();
if (!path) {
    throw new Error("No file path provided");
}
console.log("Reading file at path: " + path + "\n");

const file = Bun.file(path);
const contents = await file.text();
console.log(contents);

// Drop header row and last index since splitting on newline creates an extra entry
const loadStrings = contents.split("\n").slice(1, -1);
const loads = loadStrings.map(loadStr => loadFromFileLine(loadStr));
console.dir(loads);

