// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const typeDynamicComponent = <T extends React.ComponentType<any>>({
  component,
  props,
}: {
  component: T
  props: React.ComponentProps<T>
}) => {
  return { component, props }
}
