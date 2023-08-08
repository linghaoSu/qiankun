// type Transform = (source: string) => string;
// type ModuleMap = Record<string, string>;
//
// interface CompartmentOptions {
//   transforms?: Transform[];
// }

import { nativeGlobal } from '../../consts';

const compartmentGlobalIdPrefix = '__compartment_globalThis__';
const compartmentGlobalIdSuffix = '__';
const getCompartmentGlobalId = (id: number): CompartmentGlobalId =>
  `${compartmentGlobalIdPrefix}${String(id)}${compartmentGlobalIdSuffix}`;
type CompartmentGlobalId = `${typeof compartmentGlobalIdPrefix}${string}${typeof compartmentGlobalIdSuffix}`;

declare global {
  interface Window {
    __compartment_window__?: Window;

    [p: CompartmentGlobalId]: WindowProxy;
  }
}

let compartmentCounter = 0;

export class Compartment {
  /**
   * Since the time of execution of the code in Compartment is determined by the browser, a unique compartmentSpecifier should be generated in Compartment
   */
  private readonly id: CompartmentGlobalId = (() => {
    // make sure the compartmentSpecifier is unique
    while (nativeGlobal[getCompartmentGlobalId(compartmentCounter)]) {
      compartmentCounter++;
    }
    return getCompartmentGlobalId(compartmentCounter);
  })();

  private readonly _globalThis: WindowProxy;

  private constantIntrinsicNames: string[] = [];

  constructor(globalProxy: WindowProxy) {
    this._globalThis = globalProxy;
  }

  get globalThis(): WindowProxy {
    return this._globalThis;
  }

  protected addConstantIntrinsicNames(intrinsics: string[]): void {
    this.constantIntrinsicNames  = [...intrinsics, ...this.constantIntrinsicNames];
  }

  makeEvaluateFactory(source: string, sourceURL?: string): string {
    const sourceMapURL = sourceURL ? `//# sourceURL=${sourceURL}\n` : '';

    const globalObjectOptimizer = this.constantIntrinsicNames.length ? `const {${this.constantIntrinsicNames.join(',')}} = this;`: '';

    nativeGlobal[this.id] = this.globalThis;
    // eslint-disable-next-line max-len
    return `;(function(){with(this){${globalObjectOptimizer}${source}\n${sourceMapURL}}}).bind(window.${this.id})();`;
  }

  // TODO add return value
  // evaluate(code: string, options?: CompartmentOptions): void {
  //   const { transforms } = options || {};
  //   const transformedCode = transforms?.reduce((acc, transform) => transform(acc), code) || code;
  //   const codeFactory = this.makeEvaluateFactory(transformedCode);
  //
  //   const script = document.createElement('script');
  //   script.textContent = codeFactory;
  //   document.head.appendChild(script);
  // }
}
