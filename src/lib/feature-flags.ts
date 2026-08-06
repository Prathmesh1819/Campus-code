export interface FeatureFlags {
  enableAiAssistant: boolean;
  enableJudge0Execution: boolean;
  enableContests: boolean;
  enableClassrooms: boolean;
  enableCareerHub: boolean;
  enableCommunityDiscussions: boolean;
}

const defaultFlags: FeatureFlags = {
  enableAiAssistant: true,
  enableJudge0Execution: true,
  enableContests: true,
  enableClassrooms: true,
  enableCareerHub: true,
  enableCommunityDiscussions: true,
};

export function getFeatureFlags(): FeatureFlags {
  return {
    enableAiAssistant: process.env.NEXT_PUBLIC_FLAG_AI !== "false",
    enableJudge0Execution: process.env.NEXT_PUBLIC_FLAG_JUDGE0 !== "false",
    enableContests: process.env.NEXT_PUBLIC_FLAG_CONTESTS !== "false",
    enableClassrooms: process.env.NEXT_PUBLIC_FLAG_CLASSROOMS !== "false",
    enableCareerHub: process.env.NEXT_PUBLIC_FLAG_CAREER !== "false",
    enableCommunityDiscussions: process.env.NEXT_PUBLIC_FLAG_DISCUSSIONS !== "false",
  };
}
