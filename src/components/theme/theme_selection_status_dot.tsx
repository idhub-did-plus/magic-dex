import styled from 'styled-components';

interface StatusProps {
    status?: string;
}

export const ThemeSelectionStatusDot = styled.div<StatusProps>`
    background-color: ${props => (props.status ? '#55BC65' : '#ccc')};
    border-radius: 50%;
    height: 10px;
    width: 10px;
`;
