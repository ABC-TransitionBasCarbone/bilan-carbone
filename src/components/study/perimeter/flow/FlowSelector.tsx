'use client'

import { MenuItem, Select } from '@mui/material'
import { Document } from '@prisma/client'

interface Props {
  documents: Document[]
  selectedFlow: Document
  setSelectedFlow: (document?: Document) => void
}

const FlowSelector = ({ documents, selectedFlow, setSelectedFlow }: Props) => {
  return (
    <Select
      className="grow"
      value={selectedFlow.id}
      aria-labelledby="flow-selector-label"
      onChange={(event) => setSelectedFlow(documents.find((flow) => flow.id === event.target.value))}
      disabled={documents.length === 1}
    >
      {documents.map((document) => (
        <MenuItem key={document.id} value={document.id}>
          {document.name}
        </MenuItem>
      ))}
    </Select>
  )
}

export default FlowSelector
