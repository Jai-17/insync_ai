import { db } from "@/server/db";
import { EmailMessage, SyncResponse, SyncUpdatedResponse, EmailAddress } from "@/types";
import { Email } from "@prisma/client";
import axios from "axios";
import { syncEmailsToDatabase } from "./sync-to-db";

export class Account {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async startSync() {
        const response = await axios.post<SyncResponse>('https://api.aurinko.io/v1/email/sync', {}, {
            headers: {
                Authorization: `Bearer ${this.token}`
            },
            params: {
                daysWithin: 2,
                bodyType: 'html'
            }
        })

        return response.data;
    }

    async getUpdatedEmails({deltaToken, pageToken}: {deltaToken?: string, pageToken?: string}) {
        let params: Record<string, string> = {}
        if(deltaToken) params.deltaToken = deltaToken
        if(pageToken) params.pageToken = pageToken

        const response = await axios.get<SyncUpdatedResponse>('https://api.aurinko.io/v1/email/sync/updated', {
            headers: {
                Authorization: `Bearer ${this.token}`
            },
            params
        })

        return response.data;
    }

    async performInitialSync() {
        try {
            //start the sync process
            let syncResponse = await this.startSync();
            while(!syncResponse.ready) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                syncResponse = await this.startSync();
            }
            
            let storedDeltaToken: string = syncResponse.syncUpdatedToken;

            let updatedResponse = await this.getUpdatedEmails({deltaToken: storedDeltaToken});

            console.log('SYNC HAS COMPLETED YOO', updatedResponse)
            if(updatedResponse.nextDeltaToken) {
                // sync has completed
                storedDeltaToken = updatedResponse.nextDeltaToken
            }

            let allEmails: EmailMessage[] = updatedResponse.records

            //fetch all pages if there are more
            while(updatedResponse.nextPageToken) {
                updatedResponse = await this.getUpdatedEmails({pageToken: updatedResponse.nextPageToken});
                allEmails = allEmails.concat(updatedResponse.records);
                if(updatedResponse.nextDeltaToken) {
                    storedDeltaToken = updatedResponse.nextDeltaToken;
                }
            }

            console.log('Initial sync completed, we have synced', allEmails.length, 'emails');
            // store the latest deltaToken for future incremental syncs

            return {
                emails: allEmails,
                deltaToken: storedDeltaToken
            }

        } catch (error) {
            if(axios.isAxiosError(error)) {
                console.log('Error during sync', JSON.stringify(error.response?.data, null, 2));
            } else {
                console.log('Error during sync', error);
            }
        }
    }

    async syncEmails() {
        const account = await db.account.findUnique({
            where: { accessToken: this.token }
        })

        if (!account) throw new Error("Account not found")
        if (!account.nextDeltaToken) throw new Error("Account not ready for sync")
        
        let response = await this.getUpdatedEmails({
            deltaToken: account.nextDeltaToken
        })

        let storedDeltaToken = account.nextDeltaToken
        let allEmails: EmailMessage[] = response.records

        if(response.nextDeltaToken) {
            storedDeltaToken = response.nextDeltaToken
        }

        while (response.nextPageToken) {
            response = await this.getUpdatedEmails({ pageToken: response.nextPageToken})
            allEmails = allEmails.concat(response.records)
            if(response.nextDeltaToken) {
                storedDeltaToken = response.nextDeltaToken
            }
        }

        try {
            syncEmailsToDatabase(allEmails, account.id)
        } catch (error) {
            console.log('Error during sync:', error);
        }

        await db.account.update({
            where: { id: account.id },
            data: {
                nextDeltaToken: storedDeltaToken
            }
        })

        return {
            emails: allEmails,
            deltaToken: storedDeltaToken
        }
    }

    async sendEmail({
        from, subject, body, inReplyTo, references, to, cc, bcc, replyTo, threadId
    }: {
        from: EmailAddress,
        subject: string,
        body: string,
        inReplyTo?: string,
        references?: string,
        to: EmailAddress[],
        cc?: EmailAddress[],
        bcc?: EmailAddress[],
        replyTo: EmailAddress
        threadId?: string
    }) {
        try {
            const response = await axios.post('https://api.aurinko.io/v1/email/messages', {
                from,
                subject,
                body,
                inReplyTo,
                references,
                to,
                cc,
                bcc,
                replyTo: [replyTo],
                threadId
            }, {
                params: {
                    returnIds: true
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            })
        } catch (error) {
            if(axios.isAxiosError(error)) {
                console.log("Error sending email:", JSON.stringify(error.response?.data, null, 2));
            } else {
                console.log("Error sending email:", error);
            }
            throw error;
        }
    }
}