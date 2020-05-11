import { describe, it } from 'mocha';
import { expect } from 'chai';

import { combineLatest, from, Observer, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';


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
