# Requirements Document

## Introduction

日程时间轴解析器是一个面向个人使用的中文 Web 工具。使用者将含有时间和事件的日程文字一次性粘贴到输入框，系统调用使用者自行配置的 OpenAI 兼容 API，将文本解析为短条目待办，并按日期以时间轴形式展示。数据仅保存在浏览器本地。解析结果以查看为主，不提供编辑、完成勾选或删除操作。

## Glossary

- **System**：日程时间轴解析器 Web 应用
- **User**：唯一使用者（个人）
- **Schedule Text**：使用者一次性粘贴的、含时间和事件的日程原文
- **Todo Item**：由 AI 解析得到的短条目，至少包含标题、日期、时间
- **Timeline**：按时间先后排列的当日待办可视化列表
- **OpenAI-Compatible API**：提供 Chat Completions 风格接口的服务，通过 Base URL、API Key、模型名接入
- **Local Store**：浏览器 localStorage 中的持久化数据

## Requirements

### Requirement 1: 粘贴并解析日程文本

**User Story:** AS User, I want to paste a block of schedule text and convert it into todo items, so that I can quickly turn unstructured plans into a structured timeline.

#### Acceptance Criteria

1. WHEN User opens the application, the System SHALL display a single text input area and a parse action.
2. WHEN User pastes Schedule Text into the input area and triggers parse, the System SHALL send the Schedule Text to the configured OpenAI-Compatible API.
3. WHEN the OpenAI-Compatible API returns a successful parse result, the System SHALL convert the result into Todo Items that each contain a title, a calendar date, and a time.
4. IF the Schedule Text is empty, the System SHALL keep existing Timeline data unchanged and display a Chinese message that parse requires non-empty text.
5. IF the OpenAI-Compatible API request fails, the System SHALL keep existing Timeline data unchanged and display a Chinese error message describing the failure.

### Requirement 2: 时间轴展示与日期切换

**User Story:** AS User, I want parsed todos shown on a date-switchable timeline, so that I can review today's schedule and other days.

#### Acceptance Criteria

1. WHEN parse succeeds, the System SHALL display Todo Items on a Timeline ordered by time from earliest to latest.
2. WHEN User opens the application, the System SHALL set the visible Timeline date to the current local calendar date.
3. WHEN User selects another calendar date, the System SHALL display only Todo Items whose date matches the selected date.
4. WHILE the selected date has no Todo Items, the System SHALL display a Chinese empty-state message on the Timeline.
5. WHEN a Todo Item has a date and time, the System SHALL show the time and title as a short list entry on the Timeline.

### Requirement 3: 本地持久化

**User Story:** AS User, I want parsed todos stored in the browser, so that I can reopen the tool on the same device and still see previous results.

#### Acceptance Criteria

1. WHEN parse succeeds, the System SHALL write the new Todo Items into Local Store.
2. WHEN User reopens the application in the same browser, the System SHALL load Todo Items from Local Store and restore the Timeline.
3. WHEN newly parsed Todo Items share a date with existing Todo Items, the System SHALL replace that date's previous Todo Items with the newly parsed items for that date.
4. WHILE Local Store is unavailable, the System SHALL still attempt to display the current session's parsed Todo Items and show a Chinese warning that persistence failed.

### Requirement 4: OpenAI 兼容 API 配置

**User Story:** AS User, I want to configure Base URL, API Key, and model name, so that I can use my own OpenAI-compatible service.

#### Acceptance Criteria

1. WHEN User opens the settings area, the System SHALL provide fields for Base URL, API Key, and model name.
2. WHEN User saves API settings, the System SHALL persist Base URL, API Key, and model name in Local Store.
3. WHEN User triggers parse, the System SHALL use the saved Base URL, API Key, and model name to call the OpenAI-Compatible API.
4. IF Base URL, API Key, or model name is missing, the System SHALL block parse and display a Chinese message that API settings are incomplete.
5. WHEN the System sends a parse request, the System SHALL instruct the model to extract events with title, date, and time from the Schedule Text.

### Requirement 5: 查看型交互与中文界面

**User Story:** AS User, I want a Chinese, view-only timeline, so that I can check my schedule many times a day without extra editing steps.

#### Acceptance Criteria

1. WHEN the System renders pages, buttons, labels, empty states, and error messages, the System SHALL use Chinese.
2. WHEN Todo Items appear on the Timeline, the System SHALL present them for viewing only.
3. WHILE User is viewing the Timeline, the System SHALL provide date switching, schedule text input, parse, and API settings as the available actions.

## Out of Scope

- User accounts, multi-user collaboration, and server-side storage
- Editing, completing, canceling, or deleting individual Todo Items after parse
- Recurring events, reminders, notifications, and calendar sync
- Mobile native apps and command-line interfaces
