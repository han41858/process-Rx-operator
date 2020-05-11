import { describe, it } from 'mocha';
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

describe.only('progress', () => {
    describe('with progress value', () => {
        // one-time

        it('with delay', (done) => {
            const delays: number[] = new Array(10)
                .fill(undefined)
                .map((nothing, i: number, arr: number[]) => {
                    return (2000 - 100) * i / arr.length; // default timeout of mocha is 2000ms
                });

            const maxDelay: number = Math.max(...delays);
            const delayMargin: number = 15;

            let startTime: Date;
            let timeGap: number;

            let nextFncCallCount: number = 0;
            let errorFncCallCount: number = 0;

            const observer: Observer<[number[], number]> = {
                next([result, progress]: [number[], number]): void {
                    console.log(result, progress);

                    expect(result).to.be.a('array');
                    expect(result).to.be.lengthOf(delays.length);

                    expect(progress).to.be.a('number');
                    expect(progress).to.be.gte(0);
                    expect(progress).to.be.lte(1);

                    ++nextFncCallCount;
                },
                error(err: any): void {
                    console.log('error() in spec');

                    ++errorFncCallCount;
                },
                complete(): void {
                    console.log('complete() in spec');

                    expect(nextFncCallCount).to.be.eql(delays.length + 1); // +1 for initial emit
                    expect(errorFncCallCount).to.be.eql(0);

                    timeGap = +new Date() - +startTime;

                    console.log('timeGap:', timeGap);

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
    });
});