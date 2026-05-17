---
name: skill-finder
description: Automatically find, download, create, or adapt skills when encountering unfamiliar domains or technologies. Searches web for existing skills, creates new ones, and manages skill library.
version: 1.0.0
tags: [meta, automation, skill-management, web-search, knowledge-acquisition]
---

# Skill Finder - Automatic Skill Discovery & Creation

Meta-skill that enables automatic discovery, creation, and management of domain-specific skills when encountering new technologies or unfamiliar topics.

## When to Activate

Activate this skill when:
- User asks about a technology/framework I'm not deeply familiar with
- User requests help with a domain that would benefit from specialized knowledge
- Current task requires domain-specific best practices or patterns
- User explicitly asks to "find a skill" or "create a skill"
- Encountering repeated questions in a specific domain

## Core Workflow

### 1. Detect Skill Need

**Triggers**:
- User mentions unfamiliar technology (e.g., "help with Svelte", "using Prisma")
- Complex domain-specific task (e.g., "set up Kubernetes", "configure Terraform")
- Repeated questions in same domain
- User explicitly requests: "find a skill for X"

**Action**: Recognize the need and initiate skill search/creation workflow.

### 2. Search for Existing Skills

**Search Strategy**:

```
Priority 1: Official Sources
- GitHub: "kiro skill [technology]"
- GitHub: "[technology] kiro agent skill"
- Official docs: "[technology] AI agent instructions"

Priority 2: Community Sources
- Awesome lists: "awesome [technology] prompts"
- Community repos: "[technology] LLM instructions"
- Documentation sites: "[technology] best practices guide"

Priority 3: Adaptation Sources
- Official documentation
- Popular tutorials and guides
- Stack Overflow top answers
- GitHub README files from popular repos
```

**Web Search Queries**:
```
1. "kiro skill [technology name]"
2. "[technology] AI agent instructions"
3. "[technology] LLM prompt guide"
4. "[technology] best practices comprehensive guide"
5. "awesome [technology] resources"
```

### 3. Evaluate Search Results

**Quality Criteria**:
- ✅ Comprehensive coverage of core concepts
- ✅ Includes setup instructions and common patterns
- ✅ Has troubleshooting section
- ✅ Contains working code examples
- ✅ Up-to-date with current versions
- ✅ Covers common pitfalls and gotchas

**Decision Matrix**:
- **Found high-quality skill**: Adapt and download
- **Found partial content**: Combine multiple sources
- **Found only documentation**: Create skill from docs
- **Nothing found**: Create from scratch using web research

### 4. Download & Adapt Existing Skills

**If skill found online**:

1. **Fetch the content**:
   ```
   Use web_fetch to download the skill file
   ```

2. **Adapt to Kiro format**:
   ```markdown
   ---
   name: technology-name
   description: Brief description of what this skill covers
   version: 1.0.0
   author: original-author (if known)
   source: URL where found
   tags: [relevant, tags, here]
   ---
   
   # Technology Name - Skill Title
   
   [Adapted content with proper formatting]
   ```

3. **Validate structure**:
   - Has frontmatter with required fields
   - Includes "When to use" section
   - Contains practical examples
   - Has troubleshooting section
   - Properly formatted markdown

4. **Save to workspace**:
   ```
   Save to: .kiro/skills/[technology-name].md
   ```

### 5. Create New Skill from Research

**If no existing skill found**:

1. **Research the technology**:
   ```
   Search queries:
   - "[technology] official documentation"
   - "[technology] getting started guide"
   - "[technology] best practices"
   - "[technology] common mistakes"
   - "[technology] troubleshooting guide"
   ```

2. **Gather key information**:
   - Core concepts and terminology
   - Setup and installation steps
   - Common patterns and use cases
   - Frequent errors and solutions
   - Best practices and conventions
   - Code examples

3. **Structure the skill**:
   ```markdown
   ---
   name: technology-name
   description: What this skill helps with
   version: 1.0.0
   tags: [relevant, tags]
   created: YYYY-MM-DD
   sources: [list of URLs used for research]
   ---
   
   # Technology Name - Comprehensive Guide
   
   ## When to use
   [Describe when to activate this skill]
   
   ## Core Concepts
   [Key concepts and terminology]
   
   ## Setup & Installation
   [Step-by-step setup instructions]
   
   ## Common Patterns
   [Frequently used patterns with examples]
   
   ## Best Practices
   [Do's and don'ts]
   
   ## Troubleshooting
   [Common errors and solutions]
   
   ## Examples
   [Working code examples]
   
   ## Resources
   [Links to documentation and references]
   ```

4. **Save and activate**:
   ```
   Save to: .kiro/skills/[technology-name].md
   Immediately activate for current task
   ```

### 6. Inform User

**After creating/downloading skill**:

```
✅ Created skill: [technology-name]
📁 Location: .kiro/skills/[technology-name].md
🎯 Activated for this conversation

I now have specialized knowledge for [technology]. 
You can reuse this skill anytime by typing #[technology-name] in chat.
```

## Skill Template

Use this template when creating new skills:

```markdown
---
name: technology-name
description: Brief one-line description
version: 1.0.0
tags: [primary-tag, secondary-tag, use-case-tag]
created: YYYY-MM-DD
sources: 
  - https://official-docs-url
  - https://reference-url
---

# Technology Name - Descriptive Title

Brief introduction explaining what this technology does and why it's useful.

## When to use

Use this skill when:
- [Specific scenario 1]
- [Specific scenario 2]
- [Specific scenario 3]

## Core Concepts

### Concept 1
Explanation with example

### Concept 2
Explanation with example

## Setup & Installation

### Prerequisites
- Requirement 1
- Requirement 2

### Installation Steps

1. Step 1
   ```bash
   command here
   ```

2. Step 2
   ```bash
   command here
   ```

## Common Patterns

### Pattern 1: [Name]

**Use case**: When to use this pattern

**Implementation**:
```code
example here
```

### Pattern 2: [Name]

**Use case**: When to use this pattern

**Implementation**:
```code
example here
```

## Best Practices

### ✅ Do
- Best practice 1
- Best practice 2
- Best practice 3

### ❌ Don't
- Anti-pattern 1
- Anti-pattern 2
- Anti-pattern 3

## Troubleshooting

### Error: [Common Error Message]

**Cause**: Why this happens

**Solution**: How to fix it
```code
fix example
```

### Error: [Another Common Error]

**Cause**: Why this happens

**Solution**: How to fix it
```code
fix example
```

## Complete Example

[Full working example that demonstrates key concepts]

```code
complete example here
```

## Resources

- **Official Documentation**: [URL]
- **GitHub Repository**: [URL]
- **Community**: [URL]
- **Tutorials**: [URL]

## Version History

- **1.0.0** (YYYY-MM-DD): Initial creation
```

## Search Query Patterns

### For Popular Frameworks/Libraries

```
1. "[framework] kiro skill"
2. "[framework] AI agent instructions"
3. "[framework] comprehensive guide"
4. "[framework] best practices 2024"
5. "awesome [framework]"
```

### For DevOps/Infrastructure

```
1. "[tool] configuration guide"
2. "[tool] production setup"
3. "[tool] troubleshooting guide"
4. "[tool] common mistakes"
```

### For Programming Languages

```
1. "[language] style guide"
2. "[language] best practices"
3. "[language] common pitfalls"
4. "[language] idiomatic code"
```

### For APIs/Services

```
1. "[service] API documentation"
2. "[service] integration guide"
3. "[service] SDK examples"
4. "[service] authentication setup"
```

## Skill Categories

Organize skills by category for better management:

### Frontend
- React, Vue, Svelte, Angular
- CSS frameworks (Tailwind, Bootstrap)
- Build tools (Vite, Webpack)

### Backend
- Node.js frameworks (Express, Fastify, NestJS)
- Python frameworks (Django, Flask, FastAPI)
- Database ORMs (Prisma, TypeORM, SQLAlchemy)

### DevOps
- Docker, Kubernetes
- CI/CD (GitHub Actions, GitLab CI)
- Infrastructure as Code (Terraform, Pulumi)

### Databases
- PostgreSQL, MySQL, MongoDB
- Redis, Elasticsearch
- Database design patterns

### Cloud Providers
- AWS, Azure, GCP
- Serverless (Lambda, Cloud Functions)
- Cloud storage and CDN

### Testing
- Jest, Vitest, Pytest
- E2E testing (Playwright, Cypress)
- Testing patterns and strategies

### Tools & Utilities
- Git workflows
- Package managers
- Development tools

## Automation Rules

### Auto-Detect Skill Needs

When user message contains:
- "how do I use [technology]"
- "help with [technology]"
- "set up [technology]"
- "[technology] not working"
- "best way to [technology]"

**Action**: Automatically search for or create skill for [technology]

### Auto-Activate Skills

After creating/downloading a skill:
1. Save to `.kiro/skills/`
2. Immediately load into context
3. Inform user of availability
4. Apply knowledge to current task

### Skill Update Detection

When encountering information that contradicts existing skill:
1. Note the discrepancy
2. Search for updated information
3. Offer to update the skill
4. Version the update appropriately

## Quality Assurance

### Before Saving a Skill

Verify:
- [ ] Has valid frontmatter
- [ ] Includes "When to use" section
- [ ] Contains practical examples
- [ ] Has troubleshooting section
- [ ] Properly formatted markdown
- [ ] No broken links
- [ ] Code examples are syntactically correct
- [ ] Version numbers are accurate

### After Creating a Skill

Test:
- [ ] Can be activated via # context
- [ ] Information is accurate
- [ ] Examples work as expected
- [ ] Covers common use cases
- [ ] Addresses frequent errors

## Example Workflow

**User**: "I need help setting up Prisma with PostgreSQL"

**Agent Process**:

1. **Detect need**: User needs Prisma knowledge
2. **Check existing**: Search `.kiro/skills/` for `prisma.md`
3. **Not found**: Initiate skill creation
4. **Web search**: 
   - "prisma kiro skill"
   - "prisma comprehensive guide"
   - "prisma best practices"
5. **Gather info**: Fetch Prisma docs, setup guides, common issues
6. **Create skill**: Structure information using template
7. **Save**: `.kiro/skills/prisma.md`
8. **Activate**: Load skill into context
9. **Inform user**: "✅ Created Prisma skill and activated it"
10. **Apply**: Use skill knowledge to help with setup

## Integration with Other Skills

This skill works alongside:
- **Web search skills**: For finding information
- **Documentation skills**: For parsing official docs
- **Code generation skills**: For creating examples
- **Troubleshooting skills**: For error solutions

## Maintenance

### Regular Updates

- Review skills quarterly for outdated information
- Update version numbers when technology updates
- Add new patterns as they emerge
- Remove deprecated practices

### User Feedback

- Note when user corrects information
- Track which skills are most used
- Identify gaps in coverage
- Prioritize updates based on usage

## Best Practices for Skill Creation

### ✅ Do

- Start with official documentation
- Include working code examples
- Cover common errors and solutions
- Use clear, concise language
- Organize information logically
- Cite sources in frontmatter
- Version skills appropriately
- Test examples before including

### ❌ Don't

- Copy-paste without understanding
- Include outdated information
- Skip troubleshooting section
- Use overly complex examples
- Forget to cite sources
- Create duplicate skills
- Include untested code
- Ignore user feedback

## Skill Naming Conventions

```
Format: [technology]-[aspect].md

Examples:
- react-hooks.md
- docker-compose.md
- postgres-optimization.md
- aws-lambda.md
- git-workflows.md
```

**Rules**:
- Use lowercase
- Use hyphens for spaces
- Be specific but concise
- Avoid version numbers in name (use frontmatter)

## Success Metrics

A good skill should:
- Reduce time to solve domain-specific problems
- Prevent common mistakes
- Provide quick reference for syntax/patterns
- Enable confident decision-making
- Be reusable across projects

## Summary

This meta-skill enables automatic skill acquisition:

1. **Detect** when specialized knowledge is needed
2. **Search** for existing skills online
3. **Download** and adapt found skills
4. **Create** new skills from research if needed
5. **Activate** immediately for current task
6. **Maintain** and update over time

**Result**: Continuously growing knowledge base that improves with each new domain encountered.

---

**Usage**: This skill activates automatically when encountering unfamiliar technologies. You can also explicitly trigger it by saying "find a skill for [technology]" or "create a skill for [technology]".
