export type RichTextCommandExecutor = (commandId: string, showUI?: boolean, valueArgument?: string) => boolean

export function executeFormatCommand(execute: RichTextCommandExecutor, name: string, value?: string): void {
  execute(name, false, value)
}

export function executeTextColorCommand(execute: RichTextCommandExecutor, color: string): void {
  execute('styleWithCSS', false, 'true')
  execute('foreColor', false, color)
  execute('styleWithCSS', false, 'false')
}
