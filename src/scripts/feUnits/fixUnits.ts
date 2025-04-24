import { Command } from 'commander'
import { fixUnits } from '../../services/emissionFactors/emissionFactors'

const program = new Command()

program
  .name('fix-units')
  .description("Script pour corriger les unités des facteurs d'émissions manuels")
  .version('1.0.0')
  .parse(process.argv)

fixUnits()
