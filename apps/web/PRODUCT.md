# Product

## Register

product

## Platform

web

## Users

Software teams that use AI collaboratively. They need a single source of truth for team decisions, best practices, and domain knowledge that AI agents can reliably reference before acting. Without it, the same decisions get re-made weekly, and code reviewers spend time correcting the agent for things the team has already settled.

## Product Purpose

Synapse is the only system where AI agents must propose changes to shared team knowledge and wait for human approval before that knowledge becomes canonical. It closes the loop between what teams decide and what agents know. The product succeeds when repeated corrections drop—when reviewers stop fixing agents for decisions the team has already made, because approved context reaches agents before the mistake.

## Positioning

AI agents that wait for human approval before trusting team knowledge.

## Brand Personality

Editorial, warm, and considered. The product takes knowledge seriously without feeling clinical or sterile. The interface should feel like a well-designed internal wiki, not a SaaS dashboard. Warmer, quieter, more space.

## Anti-references

- SaaS dashboard aesthetics (too corporate, too busy)
- Playful or decorative design (gradients, illustrations, cartoon empty states)
- Alarming or high-contrast error states
- Elevation via shadow or depth illusions (use borders and tonal shifts only)

## Design Principles

- **Governance by approval**: The review workflow is the heart of the product. Visual hierarchy and interaction design should make it clear that human judgment gates what becomes team knowledge.
- **Editorial restraint**: Serif typography carries voice and authority; sans-serif carries efficiency. Together they signal a tool that respects both craftsmanship and speed.
- **Knowledge as resource**: Generous spacing and calm colors reflect respect for the knowledge itself. Dense, cluttered layouts undermine the message that this is carefully curated.
- **Warm professionalism**: The rust-and-cream palette signals expertise without coldness. Approval actions are sage green, distinct and positive. Rejections are quiet (rust borders, no alarming red).

## Accessibility & Inclusion

WCAG 2.1 AA as a baseline. Specific considerations:
- All interactive elements must have sufficient color contrast (4.5:1 minimum for body text and labels).
- The approval/rejection workflow should be keyboard accessible and screen-reader friendly.
- Reduced motion support for any animations (unlikely in this initial phase, but required if motion is added later).
- No reliance on color alone to distinguish human vs. agent proposals (currently: tint + metadata labels).
