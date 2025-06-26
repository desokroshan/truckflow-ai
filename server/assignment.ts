
import { storage } from "./storage";
import { Driver, Truck, LoadRequest, Assignment } from "@shared/schema";

export interface AssignmentRecommendation {
  recommendedDriver: Driver | null;
  recommendedTruck: Truck | null;
  confidence: number;
  reason: string;
}

export class AssignmentEngine {
  /**
   * Get assignment recommendations for a load request
   */
  async getRecommendations(loadRequest: LoadRequest): Promise<AssignmentRecommendation> {
    const availableDrivers = await storage.getAvailableDrivers();
    const availableTrucks = await storage.getAvailableTrucks();

    if (availableDrivers.length === 0 || availableTrucks.length === 0) {
      return {
        recommendedDriver: null,
        recommendedTruck: null,
        confidence: 0,
        reason: "No available drivers or trucks"
      };
    }

    // For now, use simple default assignment logic
    const recommendedDriver = this.selectDefaultDriver(availableDrivers, loadRequest);
    const recommendedTruck = this.selectDefaultTruck(availableTrucks, loadRequest);

    return {
      recommendedDriver,
      recommendedTruck,
      confidence: 0.8,
      reason: "Default assignment based on availability"
    };
  }

  /**
   * Auto-assign a driver and truck to a load request
   */
  async autoAssign(loadRequestId: number): Promise<Assignment | null> {
    const loadRequest = await storage.getLoadRequest(loadRequestId);
    if (!loadRequest) {
      throw new Error("Load request not found");
    }

    // Check if already assigned
    const existingAssignment = await storage.getAssignmentByLoadId(loadRequestId);
    if (existingAssignment) {
      return existingAssignment;
    }

    const recommendation = await this.getRecommendations(loadRequest);
    
    if (!recommendation.recommendedDriver || !recommendation.recommendedTruck) {
      return null;
    }

    // Create the assignment
    const assignment = await storage.createAssignment({
      loadRequestId,
      driverId: recommendation.recommendedDriver.id,
      truckId: recommendation.recommendedTruck.id,
      status: "assigned"
    });

    // Update availability
    await storage.updateDriverAvailability(recommendation.recommendedDriver.id, false);
    await storage.updateTruckAvailability(recommendation.recommendedTruck.id, false);

    return assignment;
  }

  /**
   * Select default driver based on simple criteria
   */
  private selectDefaultDriver(availableDrivers: Driver[], loadRequest: LoadRequest): Driver | null {
    if (availableDrivers.length === 0) return null;

    // Priority 1: Driver qualified for oversized loads if needed
    const oversizedQualified = availableDrivers.filter(d => d.qualifiedForOversized);
    if (oversizedQualified.length > 0) {
      return oversizedQualified[0];
    }

    // Priority 2: Any available driver
    return availableDrivers[0];
  }

  /**
   * Select default truck based on load requirements
   */
  private selectDefaultTruck(availableTrucks: Truck[], loadRequest: LoadRequest): Truck | null {
    if (availableTrucks.length === 0) return null;

    // Priority 1: Exact truck type match
    const matchingTrucks = availableTrucks.filter(t => 
      t.truckType.toLowerCase() === loadRequest.truckType.toLowerCase()
    );
    if (matchingTrucks.length > 0) {
      return matchingTrucks[0];
    }

    // Priority 2: Any available truck
    return availableTrucks[0];
  }

  /**
   * Complete an assignment (mark as completed and free up resources)
   */
  async completeAssignment(assignmentId: number): Promise<Assignment | null> {
    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment) return null;

    // Update assignment status
    const updatedAssignment = await storage.updateAssignmentStatus(assignmentId, "completed");

    // Free up driver and truck
    if (assignment.driverId) {
      await storage.updateDriverAvailability(assignment.driverId, true);
    }
    if (assignment.truckId) {
      await storage.updateTruckAvailability(assignment.truckId, true);
    }

    return updatedAssignment;
  }
}

export const assignmentEngine = new AssignmentEngine();
