import { DefaultValuesMapper } from '../utils/Constans';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

export class Helper {
    public static formatDate(dateInSQLFormat: Date): string {
        dayjs.locale(DefaultValuesMapper.LANGUAGE);
        const dateParser = dayjs(dateInSQLFormat);
        const now = dayjs();
        const diffMonths = now.diff(dateParser, DefaultValuesMapper.DATE_MONTHS_DIFF_UNIT);
        return `${dateParser.format(DefaultValuesMapper.FORMAT)} - ${diffMonths} ${DefaultValuesMapper.PERIOD}`;
    }
}
