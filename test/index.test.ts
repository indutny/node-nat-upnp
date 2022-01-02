const queue: [string, TestOptions][] = [];
let running = false;

function header(s: string) {
  console.log("\n==========", s, "==========");
}

function footer(n: number) {
  const arr: string[] = [];
  arr.length = n;
  console.log("\n===========" + arr.fill("=").join("") + "===========\n");
}

async function runNextInQueue(prev: string) {
  footer(prev.length);

  const [name, opts] = queue.shift() ?? [];
  if (!name || !opts) return;
  header(name);
  opts.startTests().then(() => runNextInQueue(name));
}

export function setupTest(
  testName: string,
  callback: (options: TestOptions) => void
) {
  const testOptions = new TestOptions();
  callback(testOptions);
  if (running) {
    queue.push([testName, testOptions]);
    return;
  }
  running = true;
  header(testName);
  testOptions.startTests().then(() => runNextInQueue(testName));
}

export class TestOptions {
  public testCount = 5;

  readonly tests: [string, () => Promise<boolean>][] = [];

  private isRunning = false;

  private runBeforeCallback: (() => void) | null = null;
  private runAfterCallback: (() => void) | null = null;

  public runBefore(callback: (() => void) | null): void {
    this.runBeforeCallback = callback;
  }
  public runAfter(callback: (() => void) | null): void {
    this.runAfterCallback = callback;
  }
  public run(desc: string, callback: () => Promise<boolean>): void {
    this.tests.push([desc, callback]);
  }

  public async startTests() {
    if (this.isRunning) return;
    this.isRunning = true;
    const testCount = this.testCount;
    const tests = [...this.tests];
    const runBefore = this.runBeforeCallback ?? (() => null);
    const runAfter = this.runAfterCallback ?? (() => null);

    for (let x = 0; x < tests.length; x++) {
      const [testName, run] = tests[x];
      const results = [];
      const errors: Error[] = [];

      console.log("\n" + testName);

      for (let y = 0; y < testCount; y++) {
        runBefore();
        results.push(
          await run()
            .then((s) => {
              if (s) {
                console.log("Test #" + y + ":", "\x1b[32msuccess\x1b[0m");
              } else {
                console.log("Test #" + y + ":", "\x1b[31mfailed\x1b[0m");
              }
              return s;
            })
            .catch((err) => {
              console.log("Test #" + y + ":", "\x1b[31mfailed\x1b[0m");
              errors.push(err);
              return false;
            })
        );
        runAfter();
      }
      if (!results.some((el) => !el)) {
        // success
        console.log("Testcase: \x1b[32msuccess\x1b[0m");
      } else {
        // failed
        errors.forEach((err) => console.error(err));
        console.log(
          "Testcase: \x1b[31mfailed with",
          errors.length,
          "errors\x1b[0m"
        );
      }
    }
  }

  public get isTestRunning(): boolean {
    return this.isRunning;
  }
}

import "./api.test";
import "./ssdp.test";
