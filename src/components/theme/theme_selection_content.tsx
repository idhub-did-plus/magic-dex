import React, { HTMLAttributes } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { getTheme } from '../../store/selectors';

import { StoreState } from '../../util/types';
import { CardBase } from '../common/card_base';
import { DropdownTextItem } from '../common/dropdown_text_item';
import {ThemeSelectionStatusContainer} from "./theme_selection_status"
interface OwnProps extends HTMLAttributes<HTMLSpanElement> {}

interface StateProps {
    theme: string | null;
}

type Props = StateProps & OwnProps;

const connectToWallet = () => {
    alert('connect to another wallet');
};

const goToURL = () => {
    alert('go to url');
};

const DropdownItems = styled(CardBase)`
    box-shadow: ${props => props.theme.componentsTheme.boxShadow};
    min-width: 240px;
`;

class ThemeSelectionContent extends React.PureComponent<Props> {
    public render = () => {
        const { theme, ...restProps } = this.props;
        const themeText = theme ? theme : 'Select Theme';

        const content = (
            <DropdownItems>
                <DropdownTextItem onClick={connectToWallet} text="Dark Theme" />
                <DropdownTextItem onClick={goToURL} text="Light Theme" />
            </DropdownItems>
        );

        return (
            <ThemeSelectionStatusContainer
            themeSelectionContent={content}
                headerText={themeText}
                theme={theme}
                {...restProps}
            />
        );
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        theme: getTheme(state),
    };
};

const ThemeSelectionContentContainer = connect(
    mapStateToProps,
    {},
)(ThemeSelectionContent);

export { ThemeSelectionContent, ThemeSelectionContentContainer };
