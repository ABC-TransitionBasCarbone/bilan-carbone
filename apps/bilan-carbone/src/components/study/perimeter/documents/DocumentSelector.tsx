'use client'

import { MenuItem, Select } from '@mui/material'
import { Document } from '@prisma/client'

interface Props {
  documents: Document[]
  selectedDocument: Document
  setSelectedDocument: (document?: Document) => void
}

const DocumentSelector = ({ documents, selectedDocument, setSelectedDocument }: Props) => {
  return (
    <Select
      className="grow"
      value={selectedDocument.id}
      aria-labelledby="flow-selector-label"
      onChange={(event) => setSelectedDocument(documents.find((flow) => flow.id === event.target.value))}
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

export default DocumentSelector
