# @repo/survey

Shared survey logic package for the bilan-carbone monorepo.

## Purpose

This package contains the core survey engine, types, and utilities that can be shared across multiple apps (mip, bilan-carbone, etc.).

## Contents

- **types.ts**: TypeScript type definitions for surveys, questions, and responses
- **engine.ts**: SurveyEngine class for navigation, validation, and progress tracking
- **storage.ts**: LocalStorage utilities for persisting survey responses

## Usage

```typescript
import { 
  SurveyEngine, 
  surveyStorage, 
  Survey, 
  Question 
} from '@repo/survey'

// Define a survey
const survey: Survey = {
  id: 'my-survey',
  title: 'My Survey',
  questions: [
    {
      id: 'q1',
      type: 'text',
      title: 'Your question?',
      required: true,
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Create a response
const response = {
  surveyId: survey.id,
  responseId: 'uuid-here',
  answers: {},
  currentQuestionIndex: 0,
  completed: false,
  startedAt: new Date(),
  updatedAt: new Date(),
}

// Use the engine
const engine = new SurveyEngine(survey, response)
const currentQuestion = engine.getCurrentQuestion()
engine.setAnswer('answer value')
engine.goToNextQuestion()

// Persist to localStorage
surveyStorage.saveResponse(response.responseId, response)
const loaded = surveyStorage.loadResponse(response.responseId)
```

## Features

- Type-safe survey definitions
- Question validation
- Survey navigation (next/previous)
- Progress tracking
- LocalStorage persistence
- Support for multiple question types:
  - Text input with validation
  - Single choice (radio buttons)

## Extending

To add new question types:

1. Add the question type to `types.ts`
2. Add validation logic in `engine.ts`
3. Implement the UI component in the consuming app
