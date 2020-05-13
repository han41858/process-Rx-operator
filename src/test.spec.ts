import { describe, Done, it } from 'mocha';
import { expect } from 'chai';

import { combineLatest, from, Observer, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { progress } from './progress';


describe('test', () => {
    it('ok', () => {
        expect(true).to.be.true;
    });
});

describe('observable', () => {
    it('of()', (done) => {
        let nextFncCallCount: number = 0;
        let errorFncCallCount: number = 0;

        const observer: Observer<number> = {
            next(args): void {
                ++nextFncCallCount;
            },
            error(err: any): void {
                ++errorFncCallCount;
            },
            complete(): void {
                expect(nextFncCallCount).to.be.eql(1);
                expect(errorFncCallCount).to.be.eql(0);

                done();
            }
        };

        of(1).subscribe(observer);
    });

    it('from()', (done) => {
        const data: number[] = [1, 2, 3];

        let nextFncCallCount: number = 0;
        let errorFncCallCount: number = 0;

        const observer: Observer<number> = {
            next(args): void {
                ++nextFncCallCount;
            },
            error(err: any): void {
                ++errorFncCallCount;
            },
            complete(): void {
                expect(nextFncCallCount).to.be.eql(data.length);
                expect(errorFncCallCount).to.be.eql(0);

                done();
            }
        };

        from(data).subscribe(observer);
    });

    it('combineLatest()', (done) => {
        const delays: number[] = [
            100,
            200,
            300
        ];

        const maxDelay: number = Math.max(...delays);
        const delayMargin: number = 5;

        let startTime: Date;
        let timeGap: number;

        let nextFncCallCount: number = 0;
        let errorFncCallCount: number = 0;

        const observer: Observer<number[]> = {
            next(value: number[]): void {
                expect(value).to.be.a('array');

                timeGap = +new Date() - +startTime;

                expect(timeGap).to.be.above(maxDelay - delayMargin);
                expect(timeGap).to.be.below(maxDelay + delayMargin);

                ++nextFncCallCount;
            },
            error(err: any): void {
                ++errorFncCallCount;
            },
            complete(): void {
                expect(nextFncCallCount).to.be.eql(1);
                expect(errorFncCallCount).to.be.eql(0);

                timeGap = +new Date() - +startTime;

                expect(timeGap).to.be.above(maxDelay - delayMargin);
                expect(timeGap).to.be.below(maxDelay + delayMargin);

                done();
            }
        };

        startTime = new Date();

        combineLatest<number[]>(delays.map(value => {
            return timer(value)
                .pipe(
                    map(() => value)
                );
        })).subscribe(observer);
    });
});

describe('progress', () => {
    let nextFncCallCount: number;
    let errorFncCallCount: number;

    beforeEach(() => {
        nextFncCallCount = 0;
        errorFncCallCount = 0;
    });

    it('one-time', (done: Done) => {
        const data: number[] = new Array(3)
            .fill(undefined)
            .map((nothing, i: number) => {
                return 10 + i;
            });

        let lastProgress: number;

        const observer: Observer<[number[], number]> = {
            next([result, progress]: [number[], number]): void {
                expect(result).to.be.a('array');
                expect(result).to.be.lengthOf(data.length);

                expect(progress).to.be.a('number');
                expect(progress).to.be.gte(0);
                expect(progress).to.be.lte(1);

                ++nextFncCallCount;

                lastProgress = progress;
            },
            error(err: any): void {
                ++errorFncCallCount;
            },
            complete(): void {
                expect(nextFncCallCount).to.be.eql(1);
                expect(errorFncCallCount).to.be.eql(0);

                expect(lastProgress).to.be.eql(1);

                done();
            }
        };

        progress<number[]>(data.map(value => {
            return of(value);
        })).subscribe(observer);
    });

    it('with delay', (done: Done) => {
        const delays: number[] = new Array(5)
            .fill(undefined)
            .map((nothing, i: number, arr: number[]) => {
                return (2000 - 100) * i / arr.length; // default timeout of mocha is 2000ms
            });

        let lastProgress: number;

        const maxDelay: number = Math.max(...delays);
        const delayMargin: number = 15;

        let startTime: Date;
        let timeGap: number;

        const observer: Observer<[number[], number]> = {
            next([result, progress]: [number[], number]): void {
                expect(result).to.be.a('array');
                expect(result).to.be.lengthOf(delays.length);

                expect(progress).to.be.a('number');
                expect(progress).to.be.gte(0);
                expect(progress).to.be.lte(1);

                ++nextFncCallCount;

                lastProgress = progress;
            },
            error(err: any): void {
                ++errorFncCallCount;
            },
            complete(): void {
                expect(nextFncCallCount).to.be.eql(delays.length + 1); // +1 for initial emit
                expect(errorFncCallCount).to.be.eql(0);

                expect(lastProgress).to.be.eql(1);

                timeGap = +new Date() - +startTime;

                expect(timeGap).to.be.above(maxDelay - delayMargin);
                expect(timeGap).to.be.below(maxDelay + delayMargin);

                done();
            }
        };

        startTime = new Date();

        progress<number[]>(delays.map(value => {
            return timer(value)
                .pipe(
                    switchMap(() => of(value))
                );
        })).subscribe(observer);
    });

    it('complex', (done: Done) => {
        const sources = [
            timer(1000).pipe(switchMap(() => of(1000))),
            of(0),
            of(1),
            timer(1500).pipe(switchMap(() => of(1500)))
        ];

        let lastProgress: number;

        const observer: Observer<[number[], number]> = {
            next([result, progress]: [number[], number]): void {
                expect(result).to.be.a('array');
                expect(result).to.be.lengthOf(sources.length);

                expect(progress).to.be.a('number');
                expect(progress).to.be.gte(0);
                expect(progress).to.be.lte(1);

                ++nextFncCallCount;

                lastProgress = progress;
            },
            error(err: any): void {
                ++errorFncCallCount;
            },
            complete(): void {
                // * count : 3
                // initial, 0, 1
                // 1000
                // 1500

                expect(nextFncCallCount).to.be.eql(3);
                expect(errorFncCallCount).to.be.eql(0);

                expect(lastProgress).to.be.eql(1);

                done();
            }
        };

        progress(sources)
            .subscribe(observer);
    });
});