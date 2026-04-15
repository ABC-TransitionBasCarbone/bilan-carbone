/**
 * Sample Survey Configuration
 * Example survey for testing the MIP survey system
 */

import { Survey } from '@repo/survey'

export const sampleSurvey: Survey = {
  id: 'sample-survey-1',
  title: 'Carbon Footprint Survey',
  description:
    'Help us understand your carbon footprint by answering a few questions.',
  questions: [
    {
      id: 'q1',
      type: 'text',
      title: 'What is your organization name?',
      description: 'Please enter the full name of your organization.',
      placeholder: 'e.g., ABC Transition',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 200,
      },
    },
    {
      id: 'q2',
      type: 'choice',
      title: 'What is your primary sector of activity?',
      description: 'Select the sector that best describes your organization.',
      required: true,
      options: [
        { value: 'industry', label: 'Industry' },
        { value: 'services', label: 'Services' },
        { value: 'agriculture', label: 'Agriculture' },
        { value: 'transport', label: 'Transport' },
        { value: 'energy', label: 'Energy' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'q3',
      type: 'choice',
      title: 'How many employees does your organization have?',
      required: true,
      options: [
        { value: '1-10', label: '1-10 employees' },
        { value: '11-50', label: '11-50 employees' },
        { value: '51-250', label: '51-250 employees' },
        { value: '251-500', label: '251-500 employees' },
        { value: '500+', label: 'More than 500 employees' },
      ],
    },
    {
      id: 'q4',
      type: 'text',
      title: 'What are your main carbon emission sources?',
      description:
        'Please describe the main sources of carbon emissions in your organization (e.g., transportation, energy consumption, manufacturing processes).',
      placeholder: 'Describe your main emission sources...',
      required: false,
      validation: {
        minLength: 10,
        maxLength: 1000,
      },
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
}
