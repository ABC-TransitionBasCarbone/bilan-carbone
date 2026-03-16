import { fixUnits } from '@/services/serverFunctions/emissionFactor'
import { Command } from 'commander'

const program = new Command()

program
  .name('fix-units')
  .description("Script pour corriger les unités des facteurs d'émissions manuels")
  .version('1.0.0')
  .parse(process.argv)

fixUnits()
