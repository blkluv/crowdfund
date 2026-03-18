import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

type ProjectEvent =
  | { type: 'funding'; project_id: string; current_amount: string; backers_count: number }
  | { type: 'state'; project_id: string; state: string };

@Injectable()
export class RealtimeService {
  private subjects = new Map<string, Subject<ProjectEvent>>();

  private subject(projectId: string) {
    let s = this.subjects.get(projectId);
    if (!s) {
      s = new Subject<ProjectEvent>();
      this.subjects.set(projectId, s);
    }
    return s;
  }

  streamProject(projectId: string): Observable<ProjectEvent> {
    return this.subject(projectId).asObservable();
  }

  emit(projectId: string, event: ProjectEvent) {
    this.subject(projectId).next(event);
  }
}

