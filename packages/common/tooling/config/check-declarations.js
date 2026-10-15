const path = require('node:path')
const ts = require('typescript')

const configPath = path.resolve('tsconfig.json')
const config = ts.readConfigFile(configPath, ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(config.config || {}, ts.sys, path.dirname(configPath), {
    skipLibCheck: false,
    noEmit: true,
})
const program = ts.createProgram(parsed.fileNames, parsed.options)
const diagnostics = [
    ...(config.error ? [config.error] : []),
    ...parsed.errors,
    ...program
        .getSourceFiles()
        .filter((file) => file.isDeclarationFile && !program.isSourceFileFromExternalLibrary(file))
        .flatMap((file) => program.getSyntacticDiagnostics(file).concat(program.getSemanticDiagnostics(file))),
]

if (diagnostics.length) {
    console.error(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getCanonicalFileName: (fileName) => fileName,
            getNewLine: () => ts.sys.newLine,
        }),
    )
    process.exitCode = 1
}
