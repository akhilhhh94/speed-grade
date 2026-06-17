import { useState } from 'react'
import { Button, Modal } from './ui.jsx'
import GradeSimulator from './GradeSimulator.jsx'

// Contextual entry point for the grade simulator: a button that opens the sandbox
// in a modal, optionally pre-loaded with a specific rubric + grade scale. Owns its
// own open state, so it can be dropped into any rubric context.
export default function SimulatorLauncher({
  rubricId = null,
  scaleId = null,
  label = 'Grade simulator',
  variant = 'ghost',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Grade simulator">
        <GradeSimulator initialRubricId={rubricId} initialScaleId={scaleId} />
      </Modal>
    </>
  )
}
