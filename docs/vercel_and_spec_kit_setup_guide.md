# Guide to setting up Vercel hosting and Github Spec-kit for this project
## Introduction
This guide will provide a introduction to hosting our application on Vercel and utilizing the strengths of spec-driven development (SDD) via Github Spec-kit (spec-kit). Each of the following section will describe the general context for each of the tools, followed by a detailed, beginner-oriented guide to using them. 
If you have any further questions, contact Lac and I will try to my best to answer it.
## Vercel hosting
### Web hosting
Web hosting is using a cloud service to store all the files that makes a website and make that website accessible to Internet users (IBM). There are many ways to do this; we will look at one such way: deploying a Git repository (provided by GitHub) on Vercel.

### Setup and Commands

#### Setup 
This setup assumes a Git repository that runs locally and is already connected to Github, as well as a Vercel account.

From this point on, we can either use the web GUI or the CLI alternative. For extra aura, this guide will be using Vercel CLI.

1. In your project directory, install Vercel CLI using `npm` and verify:
```
npm install -g vercel
vercel --version
```
2. Authenticate using your Vercel account:
``` 
vercel login
```
### Commands:

#### Important:

Run steps 1-3 **once** when deploying to Vercel for the **first time**. After that simply do `npm run build` and run step 4.

1. Link the project to Vercel (since we are in the project directory already, simply run the command with no argument):
```
vercel link [path-to-directory]
```
This command will open a series of interactive prompts (if you have ever used CLI agents like Codex, you know how it works). Type Y for yes, N for no, and use up and down arrows to choose between options. The questions will be approximately like this (answers are also provided as part of an example):
```
? Set up "~/projects/my-project"?
  Yes → Select Yes and press Enter

? Which scope should contain your project?
  Your Account → Select your account and press Enter

? Link to existing project?
  No → Select No and press Enter

? What's your project's name?
  my-website → Type your preferred name and press Enter

? In which directory is your code located?
  ./ → Press Enter to accept the default
```
Note that for the last question, since we are using HTML/CSS?JS, **make sure** that the current directory has the file `index.html` before choosing `./` as the answer.

2. Configure environment variables. Run:
```
vercel env add API_KEY [api-key-name]
```
A prompt will appear for you to enter the value:
```
? What's the value of API_KEY?
```
Paste the key and confirm that Vercel has logged it:
```
vercel env ls
```

3. Deploy a preview:
```
vercel deploy
```
Vercel will return a deployment URL to preview the website. Note that in this stage, we use the URL to test the website's functionalities only.

4. Moving from deploy to production:
```
vercel --prod
```
In this stage, Vercel builds  the actual production application and hosts it using the project's production domain. The website is now live. We can inspect it from the terminal using:
```
vercel inspect [link-to-website]
```
#### Important (reiterating):
After running step 4, if you are modifying the source code, you only need to run step 4 again to publish the changes.

### Other commands:
1. Debugging: use the following commands:
```
// show deployment history
vercel ls

// show runtime logs
vercel logs
// or error logs
vercel logs --level error
// or stream runtime logs
vercel logs --follow

// view deployment's details
vercel inspect [link-to-website]
// list env var
vercel env ls
// open project dashboard
vercel open
```


## Github Spec-kit  (spec-kit)
### Concepts
It is perhaps helpful, before we use the tool, to get a grasp of its underlying principles and the benefit they provide. The next few subsections provides a quick overview of SDD and its key concepts. 
#### SDD
Unlike regular vibe coding, which simply involves typing prompts and waiting for AI models to output results, SDD utilizes natural-language documents known as **"specs"** that clearly define the project to guide the models in the right direction during development. SDD has become more popular in recent years due to the greater control it give developers over AI coding assistants, enhacing clarity while reducing misalignment. SDD also lowers AI agents' "cognititve load" by introducing a single source of truth as the persistent context, without having them extensively referencing past chats and logs.
#### Spec
Spec, short for specification, are documents (artifacts) written in natural language, whose content describe implementation details of the software at hand. In other words, specs can be understood as the set of  agreement between developers and AI coding assistants on "what to build and how to build it" (IBM). Specs are often more detailed and more specific to a project than general context documents for agents such as PLAN.md or AGENTS.md (Martin Fowler). Though there are different implementation levels to it, specs are always written before any development happens.
#### Tools
There are many tools for SDD, such as Kiro, Tessl, or spec-kit, to name a few. In this guide, we will be focusing solely on spec-kit.
### spec-kit
---
##### (This section extensively references (and plagiarize) spec-kit's GitHub README.md and official documentation)
---
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
That's about 90% of your daily spec-kit workflow, I think. I will update additional commands in the `Other commands` subsection when we encounter issues along the way. Before ending this subsection, here's a few key principles on spec-kit's official documentation:
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


