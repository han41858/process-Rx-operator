import { combineLatest, defer, Observable, Subject } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';


export function progress<R extends any[]>(sources: Observable<any>[]) {
    // returns deferred factory function
    return defer(() => {
        const size: number = sources.length;

        const completeFlagArr: boolean[] = new Array(size).fill(undefined);
        const completeValueArr: R = new Array(size).fill(undefined) as R;

        const outer$: Subject<[R, number]> = new Subject<[R, number]>();

        function emit(): void {
            const progressValue: number = completeFlagArr.filter(complete => complete).length / size;

            outer$.next([
                completeValueArr,
                progressValue
            ]);
        }

        // setTimeout() for observables end immediately
        setTimeout(() => {
            // initial emit
            emit();

            combineLatest(sources.map((one$, i) => {
                return one$.pipe(
                    tap((value) => {
                        completeValueArr[i] = value;
                    }),
                    finalize(() => {
                        completeFlagArr[i] = true;

                        emit();
                    })
                );
            })).subscribe({
                error(err: any): void {
                    outer$.error(err);
                },
                complete(): void {
                    // wait 1 cycle to emit
                    setTimeout(() => {
                        outer$.complete();
                    });
                }
            });
        });

        return outer$;
    });

}
