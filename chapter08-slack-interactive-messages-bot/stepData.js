exports.multiStepData = {
    pizzatype: {
        text: 'Sauce',
        attachments: [
            {
                callback_id: 'pizzatype',
                title: 'Choose a Pizza Sauce',
                actions: [
                    {
                        name: 'regular',
                        value: 'regular',
                        text: 'Tomato Sauce',
                        type: 'button'
                    },
                    {
                        name: 'step2b',
                        value: 'oilandgarlic',
                        text: 'Oil & Garlic',
                        type: 'button'
                    }

                ]
            }
        ]
    },
    regular: {
        text: 'Pizza Type',
        attachments: [
            {
                callback_id: 'ingredient',
                title: 'Do you want a regular or pepperoni pie?',
                actions: [
                    {
                        name: 'regular',
                        value: 'regular',
                        text: 'Regular',
                        type: 'button'
                    },
                    {
                        name: 'pepperoni',
                        value: 'pepperoni',
                        text: 'Pepperoni',
                        type: 'button'
                    }

                ]
            }
        ]
    },
    oilandgarlic: {
        text: 'Extra Ingredients',
        attachments: [
            {
                callback_id: 'ingredient',
                title: 'Do you want ricotta or caramelized onions?',
                actions: [
                    {
                        name: 'ricotta',
                        value: 'ricotta',
                        text: 'Ricotta',
                        type: 'button'
                    },
                    {
                        name: 'carmelizedonions',
                        value: 'carmelizedonions',
                        text: 'Caramelized Onions',
                        type: 'button'
                    }

                ]
            }
        ]
    },
    collectsize: {
        text: 'Size',
        attachments: [
            {
                text: 'Which size would you like?',
                callback_id: 'finish',
                actions: [

                    {
                        name: 'size_list',
                        text: 'Pick a pizza size...',
                        type: 'select',
                        options: [
                            {
                                text: 'Small',
                                value: 'small'
                            },
                            {
                                text: 'Medium',
                                value: 'medium'
                            },
                            {
                                text: 'Large',
                                value: 'large'
                            }
                        ]
                    }
                ]
            }
        ]
    },
    finish: {
        attachments: [{
            color: 'good',
            text: 'Well done'
        }]
    }
};