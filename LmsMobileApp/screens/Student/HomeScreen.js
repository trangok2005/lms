import React from 'react'
import { View, Text } from 'react-native'
import Header, { HomeHeader, SimpleHeader, SearchHeader } from '../../components/common/Header';

const QuizListScreen = () => {
    return (
        <View>
            <Header title="Trang chủ" showSearch showNotif notifCount={3}
                onSearch={() => navigate('CourseSearch')} />
            <Text>HOmeScreen</Text>
        </View>
    )
}

export default QuizListScreen