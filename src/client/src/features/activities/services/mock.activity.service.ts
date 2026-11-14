import { mapLandingActivitiesDTO } from "@/features/activities/mappers/activity.mapper";
import {
  ACTIVITY_FIXTURES,
  type MockActivityScenario,
} from "@/features/activities/services/activity.fixtures";
import type { ActivityService } from "@/features/activities/services/activity.service";
import type { LandingActivities } from "@/features/activities/types";

const DEFAULT_LATENCY = 350;
const DELAY_LATENCY = 2500;

function getScenario(): MockActivityScenario {
  const value = process.env.NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO;

  if (
    value &&
    (value === "error" || value in ACTIVITY_FIXTURES)
  ) {
    return value as MockActivityScenario;
  }

  return "success";
}

function abortError(): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException("The request was aborted.", "AbortError");
  }

  return Object.assign(new Error("The request was aborted."), {
    name: "AbortError",
  });
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(abortError());
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export class MockActivityService implements ActivityService {
  private readonly scenario: MockActivityScenario;
  private readonly latency: number;

  constructor(scenario?: MockActivityScenario, latency?: number) {
    this.scenario = scenario ?? getScenario();
    this.latency =
      latency ??
      (this.scenario === "delay" ? DELAY_LATENCY : DEFAULT_LATENCY);
  }

  async getLandingActivities(signal?: AbortSignal): Promise<LandingActivities> {
    await wait(this.latency, signal);

    if (this.scenario === "error") {
      throw new Error("Unable to load activities");
    }

    return mapLandingActivitiesDTO(
      ACTIVITY_FIXTURES[this.scenario as keyof typeof ACTIVITY_FIXTURES],
    );
  }
}
