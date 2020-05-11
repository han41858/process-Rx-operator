import { describe, it } from 'mocha';
import { expect } from 'chai';

import { from, Observer, of } from 'rxjs';


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
});