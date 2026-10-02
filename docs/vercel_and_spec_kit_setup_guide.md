# Guide to setting up Vercel hosting and Github Spec-kit for this project
## Introduction
This guide will provide a introduction to hosting our application on Vercel and utilizing the strengths of spec-driven development (SDD) via Github Spec-kit (spec-kit). Each of the following section will describe the general context for each of the tools, followed by a detailed, beginner-oriented guide to using them. 
If you have any further questions, contact Lac and I will try to my best to answer it.
## Github Spec-kit  (spec-kit)
### Spec-driven development (SDD) and Github Spec-kit (spec-kit)
It is perhaps helpful, before we use the tool, to get a grasp of its underlying principles and the benefit they provide. The next few subsections provides a quick overview of SDD and its key concepts. 
#### SDD
Unlike regular vibe coding, which simply involves typing prompts and waiting for AI models to output results, SDD utilizes natural-language documents known as **"specs"** that clearly define the project to guide the models in the right direction during development. SDD has become more popular in recent years due to the greater control it give developers over AI coding assistants, enhacing clarity while reducing misalignment. SDD also lowers AI agents' "cognititve load" by introducing a single source of truth as the persistent context, without having them extensively referencing past chats and logs.
#### Spec
Spec, short for specification, are documents (artifacts) written in natural language, whose content describe implementation details of the software at hand. In other words, specs can be understood as the set of  agreement between developers and AI coding assistants on "what to build and how to build it" (IBM). Specs are often more detailed and more specific to a project than general context documents for agents such as PLAN.md or AGENTS.md (Martin Fowler). Though there are different implementation levels to it, specs are always written before any development happens.
#### Tools
There are many tools for SDD, such as Kiro, Tessl, or spec-kit, to name a few. In this guide, we will be focusing solely on spec-kit.
### spec-kit
spec-kit is Github's toolkit for SDD, providing direct CLI integration, high customizability of artifacts, and a range of community add-ons. spec-kit offers three processes: SDD, Bug fixing, and Idea assesssment; we will only talk about the first one in this guide. Its general workflow can be understood as follows:

1. Constitution: Setting up the high-level specs for the project; spec-kit call these the "constitution". The constitution are universal and immutable in the project, meaning every modification must follow them.
2. Specify - Plan - Tasks: For actual coding tasks, spec-kit generate a number of files based on a template that are mostly checklists to track completion and alignment. 
3. Implementation - Convergence: After the agent finishes implementing the task at hand (Implementing), spec-kit checks whether the resulting code satisfies everything in step 2 (Convergence). This process is repeated until no violation to the step 2's specs are made.

The following section will go in details about spec-kit setup and commands for day-to-day usage.
### Setup and commands
#### Setup
1. First, install the tool using `uv` or `PyPI`. Install them if you have not. Run either of these commands:
```
uv tool install specify-cli
pip install specify-cli
```
2. Then initalize it in the project (change project name to our project's name; for agent's name use keys in [here](https://github.github.com/spec-kit/reference/integrations.html), common candidates include `agy`, `codex`, `copilot`, `claude`, .etc.):
```
specify init [project-name] --integration [agent-name]
```
#### Commands 
The next eight steps describes a complete workflow for a SDD pipeline. Step 1 is done for a project, **the rest is done for each features (this is what you guys will work with)**; it is recommended that we reiterate and plan each step from 1-7 as carefully as possible before moving on steps 8-9.

For the next steps, there are two approaches for writing the specs: either write it inline (for short specs), or create a markdown file (it is heavily recommend to put these files in `docs/speckit-input/` for easier management) and then point spec-kit to that file in the command (for long and detailed specs).
An inline example is given in each step, while the markdown file approach for steps 1-5 is provided as a template [here](https://github.com/github/spec-kit/tree/main/templates).

1. Set the constitution. `/speckit-constitution` establishes the guiding principles for the projects. This is done **once** for each project:
```
/speckit-constitution Taskify is a "Security-First" application. All user inputs must be validated. We use a microservices architecture. Code must be fully documented.

```
2. Declare what to build. `speckit-specify` focuses on the general whats and whys of the project, not the tech stack.
```
/speckit-specify Develop Taskify, a team productivity platform where predefined users create projects, assign tasks, comment, and move tasks across Kanban columns (To Do, In Progress, In Review, Done). Five users (one product manager, four engineers), three sample projects, no login for this first phase.

```

3. Clarify what to build. 
`speckit-clarify` provides an opportunity for resolving ambiguities; optionally provide a focus area for the agent.
```
/speckit-clarify Focus on task card behavior — status changes, comment permissions, and user assignment.
```
4. Choose tech stack. `/speckit-plan` adds implementation details such as tech stacks and architecture.
```
/speckit-plan Use .NET Aspire with Postgres. The frontend is Blazor Server with drag-and-drop boards and real-time updates. Expose REST APIs for projects, tasks, and notifications.
```
5. Generate a quality checklist. `/speckit-checklist` generates a user-generated quality checklist to confirm that spec is complete, clear, and consistent. A checked item in this list only means the quality is met, not that a task is completed. Leaving the prompt blank means spec-kit will automatically generate a checklist based on your files. You can check the items yourself (recommended), or ask an agent to do it for you.
``` 
/speckit-checklist
```
6. Divide the work. `/speckit-tasks` generates a actionable, dependency-ordered tasks.md from the design artifacts. Again, you can DIY or leave it blank for the agent to do it.
```
/speckit-tasks
```

7. Consistency check. `/speckit-analyze` reports conflicts, gaps, and ambiguities across spec.md, plan.md, and tasks.md. It's read-only — if it flags issues, fix them at the source and re-run before implementing. Same as above; DIY or agent, your choice.
```
/speckit-analyze
```
8. Build. `/speckit-implement` orders the agent to execute `task.md` in order. Before implementation, it reads checklist checkbox state as a gate and asks before proceeding if any checklist items are unchecked; it does not change any checklist files or markers. The built-in checklists/requirements.md checklist is maintained by /speckit-specify and /speckit-clarify, while custom checklists remain reviewer-owned. Run it once to build everything, or scope it to one phase at a time for large features. **No additional prompt is required at this step.**
```
/speckit-implement
```
9. Verify. `/speckit-converge` runs a check in the codebase to see if it has complied to the spec, plan, and tasks. If it finds gaps, it appends new tasks to tasks.md; run /speckit-implement and converge again until it reports Converged. Otherwise you're done — proceed to review or open a PR.
```
/speckit-converge
```
That's about 90% of your daily spec-kit workflow, I think. I will update additional commands in the `Other commands` subsection when we encounter issues along the way. Before ending this subsection, here's a few key principles on spec-kit's website:
- Be explicit about what you're building and why
- Don't focus on tech stack during specification phase
- Iterate and refine your specifications before implementation
- Validate requirements and plans before coding begins
- Let the coding agent handle the implementation details.

#### Other commands
1. Agent management:

To switch from one agent to another, use:
```
specify integration status
```
to check agent status. Then run:
```
specify integration switch [new-agent-name]
```
You can install multiple agents at once then switch when necessary. This is helpful when you run out of token halfway through work (T_T).


