import { SceneInput } from "../scene/types"

function getExamples(source: string): string {
  const examples: Record<string, any> = {
    'situation_based': {
      context: "A coffee cup with the wrong name is sitting on the table between the characters.",
      openingLine: "Jamie: Wait, did someone mix up the orders or is this meant for that guy over there?",
      userGoal: "Check the name on the cup and decide whether to call the barista."
    },
    'event_based': {
      context: "The automatic doors at the mall entrance just opened, but nobody walked through.",
      openingLine: "Alex: Did the sensor just misfire, or did I miss seeing someone?",
      userGoal: "Joke about ghosts or investigate the sensor."
    },
    'topic_based': {
      context: "Quiet jazz music is playing in the background of the cafe.",
      openingLine: "Sam: Does this kind of music actually help people focus, or is it just for vibes?",
      userGoal: "Share your opinion on the best music for studying."
    },
    'emotional_sharing': {
      context: "One character is staring at their phone, quietly laughing.",
      openingLine: "Jordan: You have to see this—I didn't think he'd actually reply like that.",
      userGoal: "Ask to see the message and share the amusement."
    },
    'activity_based': {
      context: "Two people are assembling a piece of furniture, but there is one screw left over.",
      openingLine: "Taylor: Okay, either they gave us an extra, or this thing is going to collapse.",
      userGoal: "Help them figure out where the missing screw belongs."
    }
  }

  // fallback to a generic one if key not found
  const ex = examples[source.replace(' ', '_')] || examples['situation_based']
  
  return JSON.stringify(ex, null, 2)
}

export function buildScenePrompt(input: SceneInput) {
  const source = input.interactionSource.replace('_', ' ')
  const exampleJson = getExamples(input.interactionSource)

  const specific = input.specificSeed ? `\nSpecific Detail: Incorporate "${input.specificSeed}" into the scene context and dialogue.` : ''
  return `
Create a short everyday interaction scene based on: ${source}.

Environment: ${input.environment}

Characters:
${input.characterA} and ${input.characterB} (${input.relationship})

User role:
${input.userRole}

Scenario Type: ${source}
- situation based: a specific event or object in the environment triggers the talk.
- event based: something just happened or is about to happen.
- topic based: discussing a specific subject relevant to the setting.
- emotional sharing: one character shares a feeling or worry.
- activity based: they are doing something together.${specific}

Rules:
- Write a realistic moment fitting the "${source}" type.
- Do NOT describe emotions like "neutral" or "tense".
- Do NOT mention conversation focus or interaction cues.
- Do NOT use phrases like "Hey, quick question".
- The dialogue must reference something visible in the environment.
- The user goal must be actionable and related to the scenario type.

Return JSON only.

{
"context": "1-2 sentences describing what is happening (visual/auditory details)",
"openingLine": "Character: natural spoken line",
"userGoal": "A specific, actionable goal for the user in this scene",
"userRole": "The user's role in this specific situation (e.g. 'Helpful Stranger', 'Nosy Neighbor')"
}

Example (${source}):

${exampleJson}
`
}

