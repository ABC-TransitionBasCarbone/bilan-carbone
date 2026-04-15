# MIP Survey App

A survey system for carbon footprint assessment, inspired by the nosgestesclimat-app question logic.

## Features

- ✅ **Core Survey Engine**: Question navigation, validation, and state management
- ✅ **Question Types**: Text input and single choice (MVP)
- ✅ **UUID-based URLs**: Each survey response has a unique URL
- ✅ **LocalStorage Persistence**: Answers are saved automatically
- ✅ **Progress Tracking**: Visual progress bar and question counter
- ✅ **Zustand State Management**: Efficient and simple state management
- ✅ **Material-UI Components**: Modern and accessible UI

## Tech Stack

- **Next.js 16.2.3** - React framework with App Router
- **React 19.2.5** - UI library
- **TypeScript 6.0.2** - Type safety
- **Zustand 5.0.11** - State management
- **Material-UI 7.3.8** - UI components
- **UUID 13.0.0** - Unique identifier generation

## Getting Started

### Installation

```bash
# From the monorepo root
yarn install

# Or from apps/mip
cd apps/mip
yarn install
```

### Development

```bash
# Start development server (runs on port 3002)
yarn dev

# Or from monorepo root
yarn workspace mip-survey dev
```

### Build

```bash
yarn build
yarn start
```

## Project Structure

```
apps/mip/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── survey/[id]/       # Dynamic survey route with UUID
│   │   ├── layout.tsx         # Root layout with MUI theme
│   │   └── page.tsx           # Home page (redirects to new survey)
│   ├── components/            
│   │   └── survey/            # Survey UI components
│   │       ├── QuestionRenderer.tsx
│   │       └── SurveyPage.tsx
│   ├── lib/                   # Core survey logic
│   │   └── survey/
│   │       ├── types.ts       # TypeScript types
│   │       ├── engine.ts      # Survey navigation & validation
│   │       └── storage.ts     # LocalStorage utilities
│   ├── store/                 # State management
│   │   └── survey/
│   │       └── surveyStore.ts # Zustand store
│   └── data/                  # Sample data
│       └── sampleSurvey.ts    # Example survey configuration
├── package.json
├── tsconfig.json
└── next.config.mjs
```

## Usage

### Creating a Survey

1. Define your survey configuration:

```typescript
import { Survey } from '@/lib/survey/types'

const mySurvey: Survey = {
  id: 'my-survey',
  title: 'My Survey',
  description: 'Survey description',
  questions: [
    {
      id: 'q1',
      type: 'text',
      title: 'Your question?',
      required: true,
    },
    {
      id: 'q2',
      type: 'choice',
      title: 'Choose an option',
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

2. Use the SurveyPage component:

```typescript
<SurveyPage survey={mySurvey} responseId={uniqueId} />
```

### Accessing Responses

Survey responses are automatically saved to localStorage with the key pattern: `mip_survey_{responseId}`

You can access them using the storage utilities:

```typescript
import { surveyStorage } from '@/lib/survey/storage'

// Load a specific response
const response = surveyStorage.loadResponse(responseId)

// Get all response IDs
const allIds = surveyStorage.getAllResponseIds()
```

## Question Types

### Text Question

```typescript
{
  id: 'q1',
  type: 'text',
  title: 'Question title',
  placeholder: 'Enter your answer...',
  required: true,
  validation: {
    minLength: 10,
    maxLength: 500,
  }
}
```

### Choice Question

```typescript
{
  id: 'q2',
  type: 'choice',
  title: 'Question title',
  required: true,
  options: [
    { value: 'value1', label: 'Label 1' },
    { value: 'value2', label: 'Label 2' },
  ]
}
```

## Future Enhancements

- [ ] Multiple choice questions
- [ ] Number/scale questions
- [ ] Date questions
- [ ] Conditional logic (show/hide questions based on answers)
- [ ] Backend API for survey persistence
- [ ] Survey templates
- [ ] Export responses (JSON, CSV)
- [ ] Survey analytics dashboard

## License

Private - ABC Transition Bas Carbone
