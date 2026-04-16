# MIP Survey System - Implementation Summary

## Overview

This implementation creates a survey system inspired by the nosgestesclimat-app question logic. The system is built as a separate Next.js app in the monorepo at `apps/mip` with shared code in `packages/survey`.

## Architecture

### Apps Structure

```
apps/
├── bilan-carbone/       # Existing carbon accounting app
└── mip/                 # New survey app (this implementation)
    ├── src/
    │   ├── app/         # Next.js App Router
    │   ├── components/  # React components
    │   ├── store/       # Zustand state management
    │   └── data/        # Sample survey data
    └── package.json
```

### Shared Packages

```
packages/
├── survey/              # NEW: Shared survey logic
│   ├── src/
│   │   ├── types.ts    # TypeScript types
│   │   ├── engine.ts   # Survey navigation & validation
│   │   ├── storage.ts  # LocalStorage utilities
│   │   └── index.ts    # Package exports
│   └── package.json
├── types/               # Existing shared types
├── ui/                  # Existing UI components
└── db-common/           # Existing database utilities
```

## Key Features Implemented

### 1. Core Survey Engine (`packages/survey`)

- **SurveyEngine Class**: Handles navigation, validation, and state management
  - `getCurrentQuestion()`: Get current question
  - `goToNextQuestion()` / `goToPreviousQuestion()`: Navigation
  - `validateAnswer()`: Question validation
  - `getProgress()`: Progress tracking
  - `isComplete()`: Completion status

### 2. Question Types (MVP)

- **Text Input**: Multi-line text with validation
  - Min/max length validation
  - Pattern validation (regex)
  - Placeholder text
- **Single Choice**: Radio button selection
  - Multiple options
  - Required field validation

### 3. State Management (Zustand)

- `useSurveyStore`: Global survey state
  - Auto-save to localStorage
  - Response restoration
  - Error handling
  - Navigation actions

### 4. LocalStorage Persistence

- Automatic saving on every answer
- Response restoration by UUID
- Prefix-based storage (`mip_survey_`)
- Date object serialization

### 5. UUID-based URLs

- Each survey response gets a unique URL: `/survey/{uuid}`
- Home page auto-redirects to new survey with generated UUID
- Responses are tied to their UUID for later resumption

### 6. UI Components

- **QuestionRenderer**: Polymorphic question rendering
- **SurveyPage**: Main survey interface with:
  - Progress bar
  - Question counter
  - Navigation buttons (Previous/Next/Complete)
  - Error display
  - Completion screen

### 7. Material-UI Integration

- Themed components using MUI v7
- Responsive design
- Accessible form controls
- Modern styling

## Tech Stack

| Technology  | Version | Purpose          |
| ----------- | ------- | ---------------- |
| Next.js     | 16.2.3  | React framework  |
| React       | 19.2.5  | UI library       |
| TypeScript  | 6.0.2   | Type safety      |
| Zustand     | 5.0.11  | State management |
| Material-UI | 7.3.8   | UI components    |
| UUID        | 13.0.0  | Unique IDs       |

## File Structure

### apps/mip/

```
src/
├── app/
│   ├── layout.tsx              # Root layout with MUI theme
│   ├── page.tsx                # Home (redirects to new survey)
│   ├── theme.ts                # MUI theme configuration
│   └── survey/
│       └── [id]/
│           └── page.tsx        # Dynamic survey route
├── components/
│   └── survey/
│       ├── QuestionRenderer.tsx # Question type renderer
│       └── SurveyPage.tsx       # Main survey interface
├── store/
│   └── survey/
│       └── surveyStore.ts      # Zustand store
└── data/
    └── sampleSurvey.ts         # Example survey config
```

### packages/survey/

```
src/
├── types.ts       # Survey, Question, Response types
├── engine.ts      # SurveyEngine class
├── storage.ts     # LocalStorage utilities
└── index.ts       # Package exports
```

## Usage

### Running the App

```bash
# From monorepo root
yarn install
yarn workspace mip-survey dev

# Or
cd apps/mip
yarn dev
```

The app runs on http://localhost:3002

### Creating a Survey

```typescript
import { Survey } from '@repo/survey'

const mySurvey: Survey = {
  id: 'my-survey-id',
  title: 'My Survey',
  description: 'Description here',
  questions: [
    {
      id: 'q1',
      type: 'text',
      title: 'What is your name?',
      placeholder: 'Enter your name',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100,
      },
    },
    {
      id: 'q2',
      type: 'choice',
      title: 'Choose an option',
      required: true,
      options: [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
      ],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

## Sample Survey

A sample carbon footprint survey is included (`src/data/sampleSurvey.ts`) with:

1. Organization name (text input)
2. Primary sector (choice)
3. Number of employees (choice)
4. Main emission sources (text input)

## Testing the MVP

1. Start the dev server: `yarn dev`
2. Navigate to http://localhost:3002
3. You'll be redirected to a unique survey URL
4. Answer the questions
5. Use Previous/Next to navigate
6. Complete the survey
7. Refresh the page - your answers are restored from localStorage

## Future Enhancements

- [ ] Multiple choice questions (checkboxes)
- [ ] Number/scale inputs
- [ ] Date pickers
- [ ] Conditional logic (show/hide based on answers)
- [ ] Backend API for persistence
- [ ] Survey builder UI
- [ ] Export responses (JSON, CSV)
- [ ] Analytics dashboard
- [ ] Survey templates
- [ ] Question branching
- [ ] File uploads
- [ ] Email notifications

## Integration with bilan-carbone

The `@repo/survey` package is now available for use in the `apps/bilan-carbone` app:

```typescript
import { SurveyEngine, surveyStorage, Survey } from '@repo/survey'

// Use in any component or service
```

This allows the bilan-carbone app to:

- Create custom surveys for users
- Collect additional data through surveys
- Integrate survey responses with carbon calculations
- Build assessment questionnaires

## Development Guidelines

1. **Add new question types**: Update `packages/survey/src/types.ts` and `apps/mip/src/components/survey/QuestionRenderer.tsx`
2. **Modify validation**: Edit `packages/survey/src/engine.ts`
3. **Change storage**: Update `packages/survey/src/storage.ts`
4. **Customize UI**: Modify components in `apps/mip/src/components/`
5. **Update theme**: Edit `apps/mip/src/app/theme.ts`

## Notes

- All common survey logic is in `packages/survey` for reusability
- The app uses the same dependencies as bilan-carbone where possible
- TypeScript is strictly typed throughout
- localStorage is used for MVP; can be swapped for API calls later
- The architecture supports multiple surveys and question types
