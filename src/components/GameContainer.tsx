// src/components/GameContainer.tsx
import { createSignal, Show, createEffect } from "solid-js";
import { createMediaQuery } from "@solid-primitives/media";
import CharacterSelection from "./CharacterSelection"; // Assuming path
import GameScreen from "./GameScreen";         // Assuming path
import GameOver from "./GameOver";           // Assuming path
import type { Career, GameState } from "../types"; // Assuming path
import { globalGameState, setGlobalGameState } from "~/routes/index";

const CAREERS: Career[] = [
  // ... (Keep your CAREERS array definition here)
  {
    id: "intern",
    name: "Intern",
    avatar: "🧑‍💼",
    obstacles: [
      "Countless Rejections", "Not Enough Experience", "Resume Formatting Hell",
      "No Relevant Experience", "Unprepared For Interview", "Bad Phone Screen",
      "Behavioral Questions", "Video Interview Stress", "Imposter Syndrome",
      "Feeling Behind Peers", "Application Burnout", "Balancing School/Life",
      "Tough Job Market", "Low Growth Potential?", "Low Salary Offer",
      "Accept Bad Offer?", "Unrelated Tasks Assigned", "Vague Job Description",
      "Legitimacy Concerns", "Absurd Workload", "Unrealistic Deadlines",
      "Overwhelmed, Exhausted", "Can't Meet Deadlines?", "Rejection Hurts",
      "Overthinking Rejection", "Worry About Future", "Sad About Rejection",
      "Unpaid Internship?", "Comparing Placements", "Networking Pressure",
      "Siloed, Repetitive Work", "High Cost Living", "Search Process Burnout",
      "Ghosted By Recruiter", "Explain Resume Gaps", "Lost, Scared Future",
      "Irrelevant Tech Tests", "Outdated Trivia Questions", "Unrealistic Coding Challenge",
      "Useless Data Structures", "Test Hides Skills", "Timed Test Pressure",
      "Broken Test Questions", "Bad Interview Process", "Constant Learning Pressure",
      "\"Noob\" Client Demands", "Explain Tech Limits", "Pressure, Limited Experience",
      "Navigating Team Dynamics", "Potential Team Conflicts", "Micromanagement Hell",
      "Feeling Unvalued", "Assigned Menial Tasks", "Insufficient Support",
      "Bad Time Management", "Tedious Tasks", "Lack Context/Training",
      "Fear Asking Questions", "Navigating Corporate Culture", "Unwritten Rules",
      "Performance Evaluation Stress", "Fear Not Meeting Expectations", "Just Another Number",
      "Lack Of Feedback", "Unclear Expectations", "Toxic Workplace Risk",
      "Anxious About Mistakes", "Learning Workplace Etiquette", "Bad Work-Life Balance",
      "Pressure Go Above", "Poor Evaluation Fear", "Remote Isolation",
      "Unsure Meeting Contributions", "Office Gossip/Drama", "Must Constantly Prove",
      "Unfair Criticism/Blame", "Unclear/Changing Instructions", "Feeling Unprepared",
      "Need Learn Quickly", "Pressure Contribute Meaningfully", "Remote Work Challenges",
      "Adapt Company Tools", "Ask Help Effectively", "End Of Internship",
      "Job Search Again", "Worry Return Offer", "Maintain Motivation"
    ]
  },
  {
    id: "web-developer",
    name: "Web Developer",
    avatar: "👩‍💻",
    obstacles: [
      "Expects Free Website", "Untrustworthy Free Offer", "Image Attribution Rules",
      "Paid Image Banks", "Unrealistic Salary Expectation", "Lowball Job Offer",
      "Portfolio Design Issues", "Can't Use Old Designs", "Tweaking Portfolio Content",
      "Rebuild vs Link", "Website Access Locked", "Cross-Device Access Glitch",
      "Need Project Partner", "Equity-Only Collaborators", "Wrong Framework Choice",
      "SPA Wrong Choice?", "Backend Needed Now", "Framework Learning Curve",
      "Need Portfolio Project", "Saturated Junior Market", "WordPress Help Needed",
      "API Data Error", "API Auth Hell", "Wrong API App",
      "Partner Auth Needed", "Personal API Account?", "Need App Collaborator",
      "GitHub Repo Conflict", "Figma Design Delay", "Tech Stack Indecision",
      "Tweak Basic MVP", "Upskilling After Hours", "Focus Area Dilemma",
      "WordPress Still Viable?", "Learn Mobile Dev?", "Passive Side Hustle?",
      "Course vs Bootcamp", "Too Many Resources", "Beginner Course Search",
      "Learning Procrastination", "User Auth Research", "Irrelevant Tech Test",
      "Outdated Trivia Questions", "Unrealistic Coding Challenge", "Useless Data Structures",
      "Test Hides Skills", "Timed Test Pressure", "Broken Test Questions",
      "AI Job Market Fear", "AI Devalues Work", "Rapid Tech Changes",
      "Can't Find Element (CMS)", "Archaic CMS Issues", "Mysterious Website Feature",
      "Landing Page Feedback", "3D Website Glitch", "Learning Three.js / WebGL",
      "Block IP Address", "Bad Analytics Data", "Shift To DevOps?",
      "Questioning Relevance (AI)", "\"Noob\" Client Demands", "Explain Complexity Cost",
      "Find Skilled Devs (Budget)", "Time Zone Issues", "Scope Creep Fear",
      "Tight Budget Pressure", "Latest Security Practice", "Explain Tech Limits",
      "Tech Longevity Worry", "Framework Learning Treadmill", "Constant Learning Burnout",
      "AI Replaces Everything?", "AI Ethics Concern", "Losing Creative Control",
      "AI Hype Cycle", "Domain Registrar Issues", "Hidden Renewal Prices",
      "Registrar Server Limits", "Domain Pricing Maze", "Side Project UI/UX",
      "Cross-Platform Complexity", "Frontend Tedium", "Complex Data Handling",
      "Responsive Design Hell", "Wrong Target Audience", "Portfolio Time Crunch",
      "Frontend vs Backend Choice", "JavaScript Ecosystem Chaos", "CSS Best Practices",
      "Cross-Browser Bugs", "Accessibility Standards", "Performance Optimization",
      "Technical Debt Nightmare", "Complex Build Process", "Imposter Syndrome",
      "Explain To Non-Tech", "Bad Time Estimates", "Unexpected Bugs",
      "Debugging Legacy Code", "SEO Best Practices", "Git Merge Conflict",
      "Write Clean Code", "Insufficient Testing", "Outdated Dev Environment",
      "Web Hosting Config", "Security Vulnerability", "Database Choice Paralysis",
      "Third-Party API Integration", "Web Design Trends", "Designer Collaboration Friction",
      "Tight Deadlines"
    ]
  },
  {
    id: "corporate",
    name: "Corporate Employee",
    avatar: "🕴️",
    obstacles: [
      "Viral Marketing Spam", "Forced Professionalism", "No Personal Items",
      "Passive Aggressive Boss", "Arbitrary Rules", "Can't Stand Up",
      "Fear Management Moods", "Manager Double Standards", "Fired Unreasonably",
      "Weekly PIP Threat", "Fake \"Amazing\" Culture", "Whining Colleagues",
      "Unofficial PIPs", "Mentor Undermines", "Micromanaged Daily",
      "Minor Issues Escalated", "Unclear PIP Reasons", "Management Ignores You",
      "Unprofessional Recruiters", "Failing Systems", "Illegal Policy Pressure",
      "Breaks Almost Missed", "OSHA Violation Risk", "Boss Personal Tasks",
      "Refusal Retaliation", "\"Arrogant\" Boundaries", "Boss Swears At You",
      "Hunger Games Work", "Harassing Boss", "Pointless Meeting", // Shortened this one
      "Honesty Used Against", "Unfair Dismissal", "Health Suffered",
      "Confusing Management Talk", "Words Twisted", "Workplace Gossip",
      "Must Shut Up", "Confidence Weakened", "Can't Be Yourself",
      "Development Blocked", "Gaslighting Yourself", "Communication Challenged",
      "Tone-Deaf Comms", "Rigid Rules Slow", "Fired For Helping",
      "Inflexible Rules Hurt", "Angry Customers", "Automated System Hell",
      "Enforce Bad Policy", "Verbal Customer Abuse", "Management Unsupportive",
      "Forced Unneeded Help", "Judgment Disregarded", "Weaponized Incompetence",
      "Colleagues Don't Work", "Out Of Scope Tasks", "Boss Steals Credit",
      "Work Ignored", "Unreasonable Boss Requests", "Forced Non-Job Tasks",
      "Unfair Office Chores", "Negative Evaluation Threat", "Conflicting Instructions",
      "Blamed For Following", "Profit Over People", "Corporate Powerlessness",
      "Heavy Workload Burnout", "Lack Of Control", "Bad Policy Fallout",
      "Wellbeing Ignored"
    ]
  },
];

export default function GameContainer() {
  const [gameState, setGameState] = createSignal<GameState>("selection");
  const [selectedCareer, setSelectedCareer] = createSignal<Career | null>(null);
  const [score, setScore] = createSignal(0);
  
  // Media query for responsive design
  const isMobile = createMediaQuery("(max-width: 768px)");

  // Update global game state whenever local state changes
  createEffect(() => {
    setGlobalGameState(gameState());
  });

  const handleCareerSelect = (career: Career) => {
    setSelectedCareer(career);
    setGameState("playing");
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameState("gameOver");
  };

  const handleRestart = () => {
    setGameState("selection");
    setScore(0);
    setSelectedCareer(null); // Reset career as well
  };

  // Adjust container classes based on game state and device
  const containerClasses = () => {
    const base = "mx-auto";
    
    // When playing on mobile, use full width
    if (gameState() === "playing" && isMobile()) {
      return `${base} w-full`;
    }
    
    // Otherwise use max width constraint
    return `${base} max-w-3xl w-full`;
  };

  return (
    <div class={containerClasses()}>
      <Show when={gameState() === "selection"}>
        <CharacterSelection careers={CAREERS} onSelect={handleCareerSelect} />
      </Show>

      <Show when={gameState() === "playing" && selectedCareer()}>
        {/* Pass career as an accessor function if it might change,
            or directly if it's guaranteed to exist when playing */}
        <GameScreen career={selectedCareer()!} onGameOver={handleGameOver} />
      </Show>

      <Show when={gameState() === "gameOver"}>
        <GameOver score={score()} onRestart={handleRestart} />
      </Show>
    </div>
  );
}