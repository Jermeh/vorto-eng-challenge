import { parseArgs } from "util";

interface Point {
    readonly x: number;
    readonly y: number;
}

interface Load {
    loadNumber: number;
    pickup: Point;
    dropoff: Point;
    distance: number;
    distanceFromOriginToPickup: number;
    distanceFromDropoffToOrigin: number;
    delivered: boolean;
}

const ORIGIN_POINT: Point = {
    x: 0,
    y: 0
}
const MAX_DRIVE_TIME: number = 12 * 60;

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
        distanceFromOriginToPickup: distanceBetweenPoints(ORIGIN_POINT, pickup),
        distanceFromDropoffToOrigin: distanceBetweenPoints(dropoff, ORIGIN_POINT),
        delivered: false,
    };
}

/**
 * Calculates euclidean distance between two points
 */
const distanceBetweenPoints = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Determines whether a load can be picked up by a driver based on the driver's current
 * drive time & the required time to pickup, deliver, and return to origin.
 * @param currentLocation Driver's current location
 * @param currentDriveTime Driver's current drive time
 * @param load The load to be picked up and delivered.
 * @returns boolean representing if the driver is eligible to make this delivery.
 */
const canPickupLoad = (currentLocation: Point, currentDriveTime: number, load: Load): boolean => {
    const distanceToLoad = distanceBetweenPoints(currentLocation, load.pickup);
    const totalDistance = distanceToLoad + load.distance + load.distanceFromDropoffToOrigin;
    return currentDriveTime + totalDistance <= MAX_DRIVE_TIME;
}

/**
 * Find's the nearest undelivered load to a driver's current location
 * @param currentLocation The driver's current location
 * @param loads The list of all loads
 */
const nearestUndeliveredLoad = (currentLocation: Point, loads: Load[]): Load | null => {
    let nearestLoad: Load | null = null;
    let minDistance = Number.MAX_VALUE;
    loads.forEach(load => {
        const distanceToPickup = distanceBetweenPoints(currentLocation, load.pickup);
        if (!load.delivered && distanceToPickup < minDistance) {
            minDistance = distanceToPickup;
            nearestLoad = load;
        }
    });
    return nearestLoad;
}

/**
 * An implementation for VRP where a driver always attempts to pick up the nearest load 
 * to their current location, until the next load would cause them to exceed their max drive time.
 * 
 * @param loads The list of all loads
 * @returns The drivers' schedules represented as an array of load numbers
 */
const buildSchedules = (loads: Load[]): number[][] => {
    const schedules: number[][] = [];
    let undeliveredLoads = loads.length;
    while (undeliveredLoads > 0) {
        // This outer loop represents the building of a single driver's schedule.
        // Start by finding the nearest load to pickup. Then repeat until the driver
        // cannot pick up the next load, or there are no more loads;
        let driveTime = 0;
        let currentLocation = ORIGIN_POINT;
        const schedule = [];
        while (driveTime < MAX_DRIVE_TIME) {
            let nextLoad = nearestUndeliveredLoad(currentLocation, loads);
            if (!nextLoad || !canPickupLoad(currentLocation, driveTime, nextLoad)) {
                break;
            } else {
                nextLoad.delivered = true;
                undeliveredLoads--;
                const distanceToLoad = distanceBetweenPoints(currentLocation, nextLoad.pickup);
                driveTime += distanceToLoad + nextLoad.distance;
                currentLocation = nextLoad.dropoff;
                schedule.push(nextLoad.loadNumber);
            }
        }
        schedules.push(schedule);
    }
    return schedules;
}

const { positionals } = parseArgs({
    allowPositionals: true,
})
const path = positionals.pop();
if (!path) {
    throw new Error("No file path provided");
}

const file = Bun.file(path);
const contents = await file.text();
// Drop header row and last index since splitting on newline creates an extra entry
const loadStrings = contents.split("\n").slice(1, -1);
const loads = loadStrings.map(loadStr => loadFromFileLine(loadStr));
const schedules = buildSchedules(loads);
schedules.forEach(schedule => {
    console.log(`[${schedule.join(',')}]`);
})
