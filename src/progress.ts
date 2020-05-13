import { merge, Observable, of } from 'rxjs';
import { debounceTime, map, scan } from 'rxjs/operators';

interface SingleData {
    index: number;
    value: any;
}

interface AccObj<R> {
    completeFlagArr: boolean[];
    valueArr: R;
}


export function progress<R extends any[]>(sources: Observable<any>[]): Observable<[R, number]> {
    return merge(
        of(null), // initial emit
        merge(
            ...sources.map((source$: Observable<any>, index: number) => {
                return source$.pipe(
                    // inject index
                    map((value: any): SingleData => {
                        return {
                            index,
                            value: value
                        };
                    })
                );
            })
        )
    )
        .pipe(
            // accumulate complete flag & value
            scan((acc: AccObj<R>, cur: SingleData) => {
                if (!!cur) {
                    acc.completeFlagArr[cur.index] = true;
                    acc.valueArr[cur.index] = cur.value;
                }

                return acc;
            }, {
                completeFlagArr: new Array(sources.length).fill(undefined),
                valueArr: new Array(sources.length).fill(undefined)
            }),
            // refine observables of same timing
            debounceTime(0),
            // convert to result format
            map((obj: AccObj<R>): [R, number] => {
                const completeCount: number = obj.completeFlagArr.filter(flag => flag).length;
                const progressValue: number = completeCount / obj.completeFlagArr.length;

                return [obj.valueArr, progressValue];
            })
        );
}
