declare class Engine {
  constructor(...args: any[]);
  $fireHookAction(...args: any[]): any;
  [key: string]: any;
}
export default Engine;
