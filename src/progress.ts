import { combineLatest, defer, Observable, of, Subject, timer } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';


export function progress<R extends any[]>(sources: Observable<any>[]) {
    return defer(() => {
        const size: number = sources.length;

        const completeFlagArr: boolean[] = new Array(size).fill(undefined);
        const completeValueArr: R = new Array(size).fill(undefined) as R;

        const outer$: Subject<[R, number]> = new Subject<[R, number]>();

        function emit(): void {
            console.log('-- emit() --');

            const progressValue: number = completeFlagArr.filter(complete => complete).length / size;

            console.log('emit value :', [
                completeValueArr,
                progressValue
            ]);

            outer$.next([
                completeValueArr,
                progressValue
            ]);
        }

        combineLatest(sources.map((one$, i) => {
            return one$.pipe(
                tap((value) => {
                    console.log('one$ tap()', value);

                    completeValueArr[i] = value;
                }),
                finalize(() => {
                    console.log('one$ finalize()');

                    completeFlagArr[i] = true;

                    emit();
                })
            );
        })).subscribe({
            error(err: any): void {
                outer$.error(err);
            },
            complete(): void {
                outer$.complete();
            }
        });

        return outer$;
    });

}

console.log('*'.repeat(30));

const sources = [ // same with fromArray
    timer(1000).pipe(switchMap(() => of(1000))),
    of(0),
    of(1),
    timer(2000).pipe(switchMap(() => of(2000)))
];

// defer(() => {
//     const size: number = sources.length;
//     let count: number = 0;
//
//     const percent$ = new Subject();
//
//     const sourcesResult$ = forkJoin(sources.map((source$, index) => {
//         return source$.pipe(
//             finalize(() => {
//                 console.log('done', index)
//
//                 percent$.next(++count / size)
//             })
//         )
//     }))
//         .pipe(
//             // mergeAll(), // several times, without order
//             // concatAll(), // several times, with order
//             // zipAll() // one time, result is array (same with combineAll())
//         );
//
//     return zip([sourcesResult$, percent$]);
// })
//     .subscribe({
//         next(value) {
//             console.log('next()', value);
//         },
//         complete() {
//             console.log('complete()');
//         }
//     })


progress(sources)
    .pipe(
        tap((value) => {
            console.log('*** tap()', value);
        })
    )
    .subscribe({
        next(value) {
            console.log('*** next()', value);
        },
        complete() {
            console.log('*** complete()');
        }
    });