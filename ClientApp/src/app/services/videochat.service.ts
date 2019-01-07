import { connect, ConnectOptions, LocalTrack, Room } from 'twilio-video';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject } from 'rxjs/Rx';
import { Observable } from 'rxjs/Observable';

interface AuthToken {
    token: string;
}

export interface NamedRoom {
    name: string;
    maxParticipants?: number;
    participants: number;
}

export type Rooms = NamedRoom[];

@Injectable()
export class VideoChatService {
    private roomBroadcast = new ReplaySubject<boolean>();

    $roomsUpdated: Observable<boolean>;

    constructor(private readonly http: HttpClient) {
        this.$roomsUpdated = this.roomBroadcast.asObservable();
    }

    private async getAuthToken(name: string) {
        const auth =
            await this.http
                      .get<AuthToken>(`api/video/token/${name}`)
                      .toPromise();

        return auth.token;
    }

    getAllRooms() {
        return this.http
                   .get<Rooms>('api/video/rooms')
                   .toPromise();
    }

    async joinOrCreateRoom(name: string, tracks: LocalTrack[]) {
        let room: Room = null;
        try {
            const token = await this.getAuthToken(name);
            room =
                await connect(token, {
                        name,
                        tracks,
                        dominantSpeaker: true
                    } as ConnectOptions);
        } catch (error) {
            console.error(`Unable to connect to Room: ${error.message}`);
        }

        this.roomBroadcast.next(true);
        return room;
    }
}