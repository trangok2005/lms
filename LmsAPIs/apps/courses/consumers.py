from channels.generic.websocket import AsyncJsonWebsocketConsumer

class ForumConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.forum_id = self.scope['url_route']['kwargs']['forum_id']
        self.room_group_name = f'forum_{self.forum_id}'

       #tham gia
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # cho react
        await self.accept()
    #out
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

   #shiper
    async def send_new_reply(self, event):
        reply_data = event['reply']

        await self.send_json({
            'type': 'new_reply',
            'data': reply_data
        })