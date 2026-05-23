"""Seed data ported from the Whispr Studio frontend prototype."""

from __future__ import annotations

from .config import DEFAULT_LLM_MODEL, DEFAULT_STT_MODEL
from .models import (
    BenchSample,
    FormatAlternate,
    HistoryItem,
    ModelSettings,
    PrivacySettings,
    Sample,
    Settings,
    ToolCall,
    ToolPermission,
    TranscriptionSettings,
    VocabItem,
    VocabTarget,
)

DEMO_SAMPLES: tuple[Sample, ...] = (
    Sample(
        id="s1",
        raw=(
            "Okay so I need to head out tonight and grab milk, eggs, bread, and bananas if they "
            "look good. Also pick up some coffee filters and trash bags. Format this as a "
            "checklist please."
        ),
        cleaned=(
            "Milk, eggs, bread, and bananas if they look good. Also pick up some coffee filters "
            "and trash bags."
        ),
        duration=11.4,
        sttMs=380,
        llmMs=470,
        format="check",
        confidence=0.94,
        title="Grocery run",
        formatted={
            "check": (
                "- [ ] Milk\n- [ ] Eggs\n- [ ] Bread\n- [ ] Bananas (if they look good)\n"
                "- [ ] Coffee filters\n- [ ] Trash bags"
            ),
            "list": (
                "- Milk\n- Eggs\n- Bread\n- Bananas (if they look good)\n- Coffee filters\n"
                "- Trash bags"
            ),
            "markdown": (
                "# Grocery run\n\n- Milk\n- Eggs\n- Bread\n- Bananas (if they look good)\n"
                "- Coffee filters\n- Trash bags"
            ),
            "prose": (
                "Need to pick up milk, eggs, bread, and bananas if they look good - plus "
                "coffee filters and trash bags."
            ),
        },
        alternates=[
            FormatAlternate(format="check", confidence=0.94),
            FormatAlternate(format="list", confidence=0.71),
            FormatAlternate(format="markdown", confidence=0.32),
            FormatAlternate(format="prose", confidence=0.08),
        ],
        tools=[],
        routedTo="clipboard",
    ),
    Sample(
        id="s2",
        raw=(
            "Set up a sync with the design team next Tuesday at two pm for ninety minutes to "
            "review the new onboarding flow. Loop in Priya and Marco. Add it to my calendar."
        ),
        cleaned=(
            "Sync with the design team next Tuesday at 2:00 PM for 90 minutes to review the new "
            "onboarding flow. Loop in Priya and Marco."
        ),
        duration=9.8,
        sttMs=320,
        llmMs=540,
        format="calendar",
        confidence=0.97,
        title="Design sync - onboarding",
        formatted={
            "calendar": (
                "Design team sync - onboarding review\nTuesday, May 27 · 2:00-3:30 PM\n"
                "Attendees: Priya, Marco"
            ),
            "prose": (
                "Schedule a 90-minute design team sync next Tuesday at 2pm to review the new "
                "onboarding flow. Invite Priya and Marco."
            ),
            "markdown": (
                "## Design sync - onboarding\n\n- **When:** Tue May 27, 2:00-3:30 PM\n"
                "- **Who:** Priya, Marco\n- **Topic:** Review new onboarding flow"
            ),
        },
        alternates=[
            FormatAlternate(format="calendar", confidence=0.97),
            FormatAlternate(format="markdown", confidence=0.42),
            FormatAlternate(format="prose", confidence=0.18),
        ],
        tools=[
            ToolCall(
                kind="calendar.create_event",
                args={
                    "title": "Design sync - onboarding",
                    "start": "2026-05-27T14:00",
                    "end": "2026-05-27T15:30",
                    "invitees": ["Priya", "Marco"],
                },
                status="pending",
                result=None,
            )
        ],
        routedTo="calendar",
    ),
    Sample(
        id="s3",
        raw=(
            "Shipped the new onboarding yesterday, working on the data export job today, blocked "
            "on the schema review for the billing rewrite. Format as markdown and save to "
            "today's daily note."
        ),
        cleaned=(
            "Shipped the new onboarding yesterday. Working on the data export job today. Blocked "
            "on the schema review for the billing rewrite."
        ),
        duration=14.2,
        sttMs=510,
        llmMs=620,
        format="markdown",
        confidence=0.91,
        title="Standup notes",
        formatted={
            "markdown": (
                "## Standup - May 21\n\n**Yesterday**\n- Shipped the new onboarding flow\n\n"
                "**Today**\n- Data export job\n\n**Blockers**\n"
                "- Schema review for the billing rewrite"
            ),
            "list": (
                "- Yesterday: shipped onboarding\n- Today: data export job\n"
                "- Blocker: schema review (billing rewrite)"
            ),
            "prose": (
                "Yesterday I shipped the new onboarding. Today I'm working on the data export job. "
                "I'm blocked on the schema review for the billing rewrite."
            ),
        },
        alternates=[
            FormatAlternate(format="markdown", confidence=0.91),
            FormatAlternate(format="list", confidence=0.56),
            FormatAlternate(format="prose", confidence=0.31),
        ],
        tools=[
            ToolCall(
                kind="obsidian.append",
                args={"path": "daily/2026-05-21.md"},
                status="done",
                result="Appended 217 chars",
            )
        ],
        routedTo="obsidian",
    ),
)

HISTORY_ITEMS: tuple[HistoryItem, ...] = (
    HistoryItem(
        id="h1",
        when="Today · 10:14",
        title="Grocery run",
        format="check",
        preview="Milk, eggs, bread, bananas if they look good...",
        durationS=11,
        totalMs=850,
        starred=True,
        route="clipboard",
    ),
    HistoryItem(
        id="h2",
        when="Today · 09:48",
        title="Standup - May 21",
        format="markdown",
        preview="Shipped onboarding yesterday. Working on...",
        durationS=14,
        totalMs=1130,
        starred=True,
        route="obsidian",
    ),
    HistoryItem(
        id="h3",
        when="Today · 09:02",
        title="Parser idea",
        format="prose",
        preview="The parser should also handle the case where...",
        durationS=23,
        totalMs=1420,
        starred=False,
        route="file",
    ),
    HistoryItem(
        id="h4",
        when="Yesterday · 17:31",
        title="Design sync - onboarding",
        format="calendar",
        preview="Set up a sync with the design team next...",
        durationS=10,
        totalMs=860,
        starred=True,
        route="calendar",
    ),
    HistoryItem(
        id="h5",
        when="Yesterday · 14:08",
        title="Bug report draft",
        format="markdown",
        preview="Repro: open settings, toggle dark mode twice...",
        durationS=34,
        totalMs=2010,
        starred=False,
        route="clipboard",
    ),
    HistoryItem(
        id="h6",
        when="Yesterday · 11:22",
        title="Quick thank-you note",
        format="email",
        preview="Hey Jordan - thanks again for the intro to...",
        durationS=18,
        totalMs=1300,
        starred=False,
        route="clipboard",
    ),
    HistoryItem(
        id="h7",
        when="Mon May 19",
        title="Reading list",
        format="list",
        preview="Designing data-intensive applications, the...",
        durationS=12,
        totalMs=980,
        starred=False,
        route="file",
    ),
    HistoryItem(
        id="h8",
        when="Sun May 18",
        title="Trip checklist",
        format="check",
        preview="Passport, phone charger, neck pillow, eye...",
        durationS=21,
        totalMs=1610,
        starred=True,
        route="obsidian",
    ),
)

BENCH_SAMPLES: tuple[BenchSample, ...] = (
    BenchSample(
        id="b1",
        title="meeting-clip-3.wav",
        durationS=14.2,
        truth=(
            "So I think the main thing we want to ship by Friday is the new onboarding flow, "
            "and, um, the data export feature."
        ),
        ifw=(
            "So I think the main thing we want to ship by Friday is the new onboarding flow, "
            "and the data export feature."
        ),
        apple=(
            "so I think the main thing we want to ship by Friday is the new onboarding flow and "
            "um the data export feature"
        ),
        ifwMs=410,
        appleMs=620,
        ifwWer=4.1,
        appleWer=2.7,
    ),
    BenchSample(
        id="b2",
        title="grocery-list.wav",
        durationS=11.4,
        truth="I need to grab milk, eggs, bread, and bananas if they look good.",
        ifw="I need to grab milk eggs bread and bananas if they look good",
        apple="I need to grab milk, eggs, bread, and bananas if they look good.",
        ifwMs=280,
        appleMs=510,
        ifwWer=5.4,
        appleWer=1.9,
    ),
    BenchSample(
        id="b3",
        title="standup-may-21.wav",
        durationS=14.2,
        truth=(
            "Shipped the new onboarding flow yesterday. Working on the data export job today. "
            "Blocked on the schema review for billing."
        ),
        ifw=(
            "Shipped the new onboarding flow yesterday. Working on the data export job today. "
            "Blocked on the schema review for billing."
        ),
        apple=(
            "shipped the new onboarding flow yesterday working on the data export job today "
            "blocked on the schema review for billing"
        ),
        ifwMs=380,
        appleMs=590,
        ifwWer=1.8,
        appleWer=2.2,
    ),
    BenchSample(
        id="b4",
        title="noisy-cafe.wav",
        durationS=9.7,
        truth="Let's get the proposal out before the call on Friday.",
        ifw="Let's get the proposal out before the call on Friday.",
        apple="let's get the proposal out before the call Friday",
        ifwMs=320,
        appleMs=540,
        ifwWer=0,
        appleWer=6.2,
    ),
    BenchSample(
        id="b5",
        title="accented-en-1.wav",
        durationS=17.3,
        truth="The library uses a custom tokenizer that handles code blocks and inline markup.",
        ifw="The library uses a custom tokenizer that handles code blocks and inline markup.",
        apple="the library uses a custom tokeniser that handles code blocks an inline markup",
        ifwMs=460,
        appleMs=690,
        ifwWer=2.0,
        appleWer=4.4,
    ),
)

VOCAB_INITIAL: tuple[VocabItem, ...] = (
    VocabItem(
        id=1,
        phrase="format as markdown",
        target=VocabTarget(type="format", value="markdown"),
        builtin=True,
        hits=142,
    ),
    VocabItem(
        id=2,
        phrase="make a checklist",
        target=VocabTarget(type="format", value="check"),
        builtin=True,
        hits=88,
    ),
    VocabItem(
        id=3,
        phrase="make a list / bullet points",
        target=VocabTarget(type="format", value="list"),
        builtin=True,
        hits=61,
    ),
    VocabItem(
        id=4,
        phrase="numbered steps",
        target=VocabTarget(type="format", value="steps"),
        builtin=True,
        hits=24,
    ),
    VocabItem(
        id=5,
        phrase="draft an email",
        target=VocabTarget(type="format", value="email"),
        builtin=True,
        hits=11,
    ),
    VocabItem(
        id=6,
        phrase="add to my calendar",
        target=VocabTarget(type="tool", value="calendar.create_event"),
        builtin=True,
        hits=14,
    ),
    VocabItem(
        id=7,
        phrase="save to inbox",
        target=VocabTarget(type="tool", value="obsidian.append"),
        builtin=True,
        hits=33,
    ),
    VocabItem(
        id=8,
        phrase="file an issue",
        target=VocabTarget(type="tool", value="github.create_issue"),
        builtin=False,
        hits=2,
    ),
    VocabItem(
        id=9,
        phrase="log it in my journal",
        target=VocabTarget(type="tool", value="obsidian.append"),
        builtin=False,
        hits=7,
    ),
)

INITIAL_TOOLS: tuple[ToolPermission, ...] = (
    ToolPermission(
        id="clipboard.copy",
        label="Copy to clipboard",
        desc="Always-available; how outputs reach you in the menubar flow.",
        perm="auto",
    ),
    ToolPermission(
        id="format.markdown",
        label="Format -> Markdown",
        desc="Write .md output. No side effects beyond text.",
        perm="auto",
    ),
    ToolPermission(
        id="format.list",
        label="Format -> List / check",
        desc="Format-only transformations.",
        perm="auto",
    ),
    ToolPermission(
        id="file.write.inbox",
        label="Write to inbox folder",
        desc="Writes into ~/Whispr/inbox/ only. You picked this folder.",
        perm="auto",
    ),
    ToolPermission(
        id="file.write.any",
        label="Write to other folders",
        desc="Any path the agent specifies.",
        perm="ask",
    ),
    ToolPermission(
        id="obsidian.append.daily",
        label="Append to daily note",
        desc="Adds to today's note in your configured vault.",
        perm="auto",
    ),
    ToolPermission(
        id="obsidian.append.other",
        label="Append to other notes",
        desc="Any path in the Obsidian vault.",
        perm="ask",
    ),
    ToolPermission(
        id="calendar.create_event",
        label="Create calendar event",
        desc="Adds events to your default macOS Calendar.",
        perm="ask",
    ),
    ToolPermission(
        id="reminders.create",
        label="Create reminder",
        desc="Adds items to macOS Reminders.",
        perm="ask",
    ),
    ToolPermission(
        id="github.create_issue",
        label="File a GitHub issue",
        desc="Repos must be allowlisted below.",
        perm="ask",
    ),
    ToolPermission(
        id="shell.run",
        label="Run a shell command",
        desc="Allowlist-restricted. Off by default.",
        perm="off",
    ),
    ToolPermission(
        id="web.search",
        label="Web search",
        desc="DuckDuckGo / Brave. Sends the query off-device.",
        perm="off",
    ),
)

DEFAULT_SETTINGS = Settings(
    transcription=TranscriptionSettings(
        primaryEngine=DEFAULT_STT_MODEL,
        shadowEngine="Apple Speech",
        initialPrompt="",
        language="auto",
    ),
    model=ModelSettings(
        runtime="llama.cpp",
        model=DEFAULT_LLM_MODEL,
        contextWindow=8192,
        temperature=0.2,
        multiAgent=False,
    ),
    privacy=PrivacySettings(
        keepRawAudio=True,
        audioRetention="30d",
        anonymousErrorReports=False,
        allowCloudFallback=False,
    ),
    tools=list(INITIAL_TOOLS),
)
