export function getOperatorMongo(oparator) {
    let op = '';
    
    switch (oparator) {
        case '%':
            op = 'in';
            break;
        case '=':
            op = 'eq';
            break;
        case '!=':
            op = 'ne';
            break;
        case '>=':
            op = 'gte';
            break;
        case '<=':
            op = 'lte';
            break;
        case '>':
            op = 'gt';
            break;
        case '<':
            op = 'lt';
            break;
        default:
            break;
    }

    return op;
}